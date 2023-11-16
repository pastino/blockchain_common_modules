import { Block, TransactionReceipt } from "alchemy-sdk";
import { Message } from "./kakao";
import moment from "moment";
import { getIsERC721Event } from "../ABI";
import { getRepository } from "typeorm";
import { ContractManager } from "./contract";
import { NFT } from "./nft";
import { Transaction as TransactionEntity } from "../entities/Transaction";
import { Log as LogEntity } from "../entities/Log";
import { Topic as TopicEntity } from "../entities/Topic";
import { sleep } from "../utils";
import { BlockNumber as BlockNumberEntity } from "../entities/BlockNumber";
import { Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { DecodedLog } from "../entities/DecodedLog";
import { web3 } from "../web3";
import { ContractError } from "../entities/ContractError";

const kakaoMessage = new Message();

interface ABIIntreface {
  name: string;
  type: string;
  [key: string]: any;
}

interface Success<T = undefined> {
  isSuccess: boolean;
  message?: string;
  data?: T;
}

export class Transaction {
  private transactionHash = "";
  private blockData: Block;
  private blockNumber: BlockNumberEntity;

  constructor({
    blockData,
    blockNumber,
  }: {
    blockData: Block;
    blockNumber: BlockNumberEntity;
  }) {
    this.blockData = blockData;
    this.blockNumber = blockNumber;
  }

  private async getTransactionReceipt(
    transactionHash: string,
    retryCount: number = 10
  ): Promise<TransactionReceipt | null> {
    try {
      const response = await web3.eth.getTransactionReceipt(transactionHash);
      return response;
    } catch (e: any) {
      if (retryCount > 0) {
        await sleep(3);
        return this.getTransactionReceipt(transactionHash, retryCount - 1);
      } else {
        await kakaoMessage.sendMessage(
          `${moment(new Date()).format(
            "MM/DD HH:mm"
          )}\n\ntransactionReceipt error - getTransactionReceipt`
        );
        throw e;
      }
    }
  }

  private async getTransaction(
    transactionHash: string,
    retryCount: number = 10
  ): Promise<any> {
    try {
      const response = await web3.eth.getTransaction(transactionHash);
      return response;
    } catch (e: any) {
      if (retryCount > 0) {
        await sleep(3);
        return this.getTransaction(transactionHash, retryCount - 1);
      } else {
        await kakaoMessage.sendMessage(
          `${moment(new Date()).format(
            "MM/DD HH:mm"
          )}\n\ntransaction error - getTransaction`
        );
        throw e;
      }
    }
  }

  private async createContractAndNFT({
    tokenId,
    contractAddress,
    transaction,
  }: {
    tokenId: number | string;
    contractAddress: string;
    transaction: TransactionEntity;
  }): Promise<{
    isSuccess: boolean;
    contractData: ContractEntity;
    nftData?: NFTEntity;
  }> {
    try {
      const contract = new ContractManager({
        address: contractAddress,
      });

      const contractData = await contract.saveContract(tokenId);

      await getRepository(TransactionEntity).update(
        { id: transaction.id },
        { contract: contractData }
      );

      let nftData;

      if (tokenId) {
        const nft = new NFT({
          contract: contractData,
          tokenId,
        });
        nftData = await nft.saveNFT();
      }

      return { isSuccess: true, contractData, nftData };
    } catch (e: any) {
      await getRepository(ContractError).save({
        transactionHash: transaction.hash,
        blockNumber: this.blockNumber.blockNumber,
        address: contractAddress,
        returnStringData: JSON.stringify(e.message),
      });
      throw e;
    }
  }

  private async createLog({
    log,
    transaction,
    contractData,
    nftData,
    decodedLog,
  }: {
    log: any;
    transaction: TransactionEntity;
    contractData?: ContractEntity;
    nftData?: NFTEntity;
    decodedLog?: any;
  }) {
    try {
      const { topics, ...logWithoutTopics } = log;
      delete logWithoutTopics?.id;
      const logInputData: any = {};

      if (contractData) {
        logInputData.contract = contractData;
      }

      if (nftData) {
        logInputData.nft = nftData;
      }

      const logData = await getRepository(LogEntity).save({
        transaction,
        ...logWithoutTopics,
        ...logInputData,
      });

      if (decodedLog) {
        try {
          const createdDecodeLog = await getRepository(DecodedLog).save({
            ...decodedLog,
            contractAddress: decodedLog.contract,
            log: logData,
            ...logInputData,
            transaction,
            timestamp: transaction.timestamp,
            eventTime: transaction.eventTime,
            gasUsed: transaction.gasUsed,
            cumulativeGasUsed: transaction.cumulativeGasUsed,
            effectiveGasPrice: transaction.effectiveGasPrice,
            gasPrice: transaction.gasPrice,
            gasLimit: transaction.gasLimit,
          });
          await getRepository(LogEntity).update(
            { id: logData.id },
            { decodedLog: createdDecodeLog }
          );
        } catch (e) {
          throw e;
        }
      }

      for (let i = 0; i < topics.length; i++) {
        const value = topics[i];
        await getRepository(TopicEntity).save({
          index: i,
          topic: value,
          log: logData,
        });
      }
    } catch (e: any) {
      throw e;
    }
  }

  public async progressTransaction(): Promise<any> {
    try {
      const transactions = this.blockData?.transactions;
      if (!transactions || transactions.length === 0) {
        await getRepository(BlockNumberEntity).update(
          { id: this.blockNumber.id },
          { isNFTCompletedUpdate: true }
        );
        return { isSuccess: false, message: "Transactions are empty" };
      }

      let erc721Logs: any = [];
      const nonErc721Logs = [];

      // First pass: Process all transactions and gather ERC721 and non-ERC721 logs
      for (let i = 0; i < transactions.length; i++) {
        const transactionHash = transactions[i];
        const transactionData = await this.getTransaction(transactionHash);
        const transactionReceipt = await this.getTransactionReceipt(
          transactionHash
        );

        const timestamp = this.blockData.timestamp;
        const eventTime = new Date(timestamp * 1000);
        const timeOption = {
          timestamp,
          eventTime,
        };
        const transaction = await getRepository(TransactionEntity).save({
          ...transactionData,
          data: transactionData.input,
          blockNumber: this.blockNumber,
          gasUsed: transactionReceipt?.gasUsed,
          cumulativeGasUsed: transactionReceipt?.cumulativeGasUsed,
          effectiveGasPrice: transactionReceipt?.effectiveGasPrice,
          gasPrice: transactionData?.gasPrice,
          gasLimit: transactionData?.gas,
          value: transactionData?.value,
          chainId: parseInt(transactionData.chainId, 16) || null,
          ...timeOption,
        });

        const logs = transactionReceipt?.logs;

        if (!logs || logs.length === 0) continue;

        // 트랜잭션 로그 데이터들 필터링
        for (let j = 0; j < logs.length; j++) {
          const log = logs[j];
          const data = await getIsERC721Event(
            log,
            logs,
            this.blockNumber?.blockNumber,
            transactionHash
          );

          if (data.isERC721Event) {
            erc721Logs.push({
              log,
              decodedData: data.decodedData,
              transaction,
            });
          } else {
            nonErc721Logs.push({ log, transaction });
          }
        }

        // 판매에 해당하는 전송 로그를 필터링합니다.
        erc721Logs = erc721Logs.filter((log: any) => {
          if (
            log.decodedData?.action !== "Transfer" &&
            log.decodedData?.action !== "TransferSingle"
          ) {
            return true;
          }

          // 이 전송 로그에 해당하는 판매 로그가 있는지 확인합니다
          const matchingSaleLog = erc721Logs
            .filter((log: any) => log.decodedData?.action === "Sale")
            .find(
              (saleLog: any) =>
                saleLog.decodedData?.contract === log.decodedData?.contract &&
                saleLog.decodedData?.tokenId === log.decodedData?.tokenId &&
                saleLog.decodedData?.from === log.decodedData?.from &&
                saleLog.decodedData?.to === log.decodedData?.to
            );

          // 해당하는 판매 로그가 없는 경우에만 로그를 유지합니다
          return matchingSaleLog === undefined;
        });
      }

      // Second pass: Process all ERC721 logs
      for (let i = 0; i < erc721Logs.length; i++) {
        const { log, decodedData, transaction } = erc721Logs[i];
        const contractAddress = decodedData?.contract;
        const result = await this.createContractAndNFT({
          transaction,
          tokenId: decodedData?.tokenId,
          contractAddress,
        });
        const contractData = result.contractData;
        const nftData = result.nftData;

        await this.createLog({
          log,
          transaction,
          contractData,
          nftData,
          decodedLog: decodedData || null,
        });
      }

      await getRepository(BlockNumberEntity).update(
        { id: this.blockNumber.id },
        { isNFTCompletedUpdate: true }
      );

      // Third pass: Process all non-ERC721 logs
      for (let i = 0; i < nonErc721Logs.length; i++) {
        const { log, transaction } = nonErc721Logs[i];

        await this.createLog({
          log,
          transaction,
        });
      }
      return { isSuccess: true };
    } catch (e) {
      throw e;
    }
  }
}
