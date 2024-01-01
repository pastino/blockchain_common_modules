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

      console.log(111, 1);

      const contractData = await contract.saveContract(tokenId);
      console.log(111, 2);
      await getRepository(TransactionEntity).update(
        { id: transaction.id },
        { contract: contractData }
      );

      let nftData;
      console.log(111, 3);

      if (tokenId) {
        const nft = new NFT({
          contract: contractData,
          tokenId,
        });
        nftData = await nft.saveNFT();
      }
      console.log(111, 4);
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
      console.log(7, topics.length);
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

      for (let index = 0; index < transactions.length; index++) {
        const transactionHash = transactions[index];

        console.log(1);
        const transactionData = await this.getTransaction(transactionHash);
        console.log(2);
        const transactionReceipt = await this.getTransactionReceipt(
          transactionHash
        );
        console.log(3);

        const timestamp = this.blockData.timestamp;
        const eventTime = new Date(timestamp * 1000);
        eventTime.setMinutes(
          eventTime.getMinutes() + eventTime.getTimezoneOffset()
        );

        const timeOption = {
          timestamp,
          eventTime,
        };
        console.log(4);
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
        console.log(5);
        const logs = transactionReceipt?.logs;

        if (!logs || logs.length === 0) continue;

        console.log(
          `${this.blockNumber?.blockNumber}: transactions 길이 - ${index}/${transactions.length}, logs 길이 - ${logs.length}`
        );

        for (const log of logs) {
          console.log(1, 6);
          const data = await getIsERC721Event(
            log,
            logs,
            this.blockNumber?.blockNumber,
            transaction.hash
          );
          const decodedData = data.decodedData;
          console.log(1, 7);
          if (data.isERC721Event) {
            console.log(2, 8);
            const contractAddress = decodedData?.contract;
            const result = await this.createContractAndNFT({
              transaction,
              tokenId: decodedData?.tokenId,
              contractAddress,
            });
            console.log(2, 9);
            const contractData = result.contractData;
            const nftData = result.nftData;

            await this.createLog({
              log,
              transaction,
              contractData,
              nftData,
              decodedLog: decodedData || null,
            });
            console.log(2, 10);
          } else {
            console.log(2, 11);
            await this.createLog({
              log,
              transaction,
            });
          }
        }
      }

      console.log(10);

      await getRepository(BlockNumberEntity).update(
        { id: this.blockNumber.id },
        { isNFTCompletedUpdate: true }
      );
      console.log(11);
      return { isSuccess: true };
    } catch (e) {
      throw e;
    }
  }
}
