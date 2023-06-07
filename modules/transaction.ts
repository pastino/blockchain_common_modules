import {
  Block,
  Log,
  TransactionReceipt,
  TransactionResponse,
} from "alchemy-sdk";
import { alchemy } from "../blockEventHandler";
import { Message } from "./kakao";
import moment from "moment";
import { getIsERC721Event, SIGNATURE_LIST } from "../ABI";
import { getRepository } from "typeorm";
import { Contract } from "./contract";
import { NFT } from "./nft";
import { Transaction as TransactionEntity } from "../entities/Transaction";
import { Log as LogEntity } from "../entities/Log";
import { Topic as TopicEntity } from "../entities/Topic";
import { sleep } from "../utils";
import { BlockNumber as BlockNumberEntity } from "../entities/BlockNumber";
import { Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { DecodedLog } from "../entities/DecodedLog";

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
    transactionHash,
    blockData,
    blockNumber,
  }: {
    transactionHash: string;
    blockData: Block;
    blockNumber: BlockNumberEntity;
  }) {
    this.transactionHash = transactionHash;
    this.blockData = blockData;
    this.blockNumber = blockNumber;
  }

  private async getTransactionReceipt(
    transactionHash: string,
    retryCount: number = 10
  ): Promise<TransactionReceipt | null> {
    try {
      const response = await alchemy.core.getTransactionReceipt(
        transactionHash
      );
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
  ): Promise<TransactionResponse | null> {
    try {
      const response = await alchemy.core.getTransaction(transactionHash);
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

  private async anylyzeLog(log: Log): Promise<
    Success<{
      name: string;
      type: string;
      [key: string]: any;
    }>
  > {
    const topics = log.topics;
    const haxSignature = topics[0];

    const signatureDataLength = SIGNATURE_LIST.filter(
      (signature) => signature.hexSignature === haxSignature
    ).length;

    let signatureData;
    // TODO 1. 여기 수정 필요
    if (signatureDataLength > 1) {
      signatureData = SIGNATURE_LIST.find(
        (signature) =>
          signature.hexSignature === haxSignature &&
          topics.length === signature.indexLength + 1
      );
    } else if (signatureDataLength === 1) {
      signatureData = SIGNATURE_LIST.find(
        (signature) => signature.hexSignature === haxSignature
      );
    }

    if (!signatureData)
      return { isSuccess: false, message: "signatureData is empty" };

    try {
      const decodedSignatureData = signatureData.function(log);
      return { isSuccess: true, data: decodedSignatureData };
    } catch (e) {
      console.log(log.transactionHash, topics, signatureData);
      return { isSuccess: false };
    }
  }

  private async getDecodedLogs(
    logs: Log[]
  ): Promise<{ isERC721: boolean; decodedLogs: ABIIntreface[] }> {
    const decodedLogs: ABIIntreface[] = [];
    for (let i = 0; i < logs.length; i++) {
      const decodedSignatureData = await this.anylyzeLog(logs[i]);
      if (decodedSignatureData?.data) {
        decodedLogs.push(decodedSignatureData.data);
      }
    }

    const isERC721 = decodedLogs.find(
      (item) => item.name === "Transfer" && item.type === "ERC721"
    );

    return { isERC721: isERC721 ? true : false, decodedLogs };
  }

  private hexToStringValue = (hexValue: string): string => {
    return parseInt(hexValue, 16).toString();
  };

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
      const contract = new Contract({
        address: contractAddress,
      });
      const contractData = await contract.saveContract();

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
    log: Log;
    transaction: TransactionEntity;
    contractData?: ContractEntity;
    nftData?: NFTEntity;
    decodedLog: any;
  }) {
    try {
      const { topics, ...logWithoutTopics } = log;

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
        await getRepository(DecodedLog).save({
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
      const transactionData = await this.getTransaction(this.transactionHash);
      if (!transactionData)
        return { isSuccess: false, message: "transactionData is empty" };
      const transactionReceipt = await this.getTransactionReceipt(
        this.transactionHash
      );

      const logs = transactionReceipt?.logs;
      if (!logs || logs.length === 0)
        return { isSuccess: false, message: "logs is empty" };
      const { isERC721 } = await this.getDecodedLogs(logs);
      if (!isERC721)
        return { isSuccess: false, message: "is not ERC721 transaction" };
      const timestamp = this.blockData.timestamp;
      const eventTime = new Date(timestamp * 1000);
      const timeOption = {
        timestamp,
        eventTime,
      };

      const transaction = await getRepository(TransactionEntity).save({
        ...transactionData,
        blockNumber: this.blockNumber,
        gasUsed: this.hexToStringValue(
          transactionReceipt?.gasUsed?._hex || "0x0"
        ),
        cumulativeGasUsed: this.hexToStringValue(
          transactionReceipt?.cumulativeGasUsed?._hex || "0x0"
        ),
        effectiveGasPrice: this.hexToStringValue(
          transactionReceipt?.effectiveGasPrice?._hex || "0x0"
        ),
        gasPrice: this.hexToStringValue(
          transactionData?.gasPrice?._hex || "0x0"
        ),
        gasLimit: this.hexToStringValue(
          transactionData?.gasLimit?._hex || "0x0"
        ),
        value: this.hexToStringValue(transactionData?.value?._hex || "0x0"),
        ...timeOption,
      });

      // 트랜잭션 로그 데이터들 저장
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const data = await getIsERC721Event(log);
        let contractData;
        let nftData;
        if (data.isERC721Event) {
          const decodedData = data.decodedData;
          const contractAddress = decodedData?.contract;
          const result = await this.createContractAndNFT({
            transaction,
            tokenId: decodedData?.tokenId,
            contractAddress,
          });
          contractData = result.contractData;
          nftData = result.nftData;
        }
        await this.createLog({
          log,
          transaction,
          contractData,
          nftData,
          decodedLog: data.decodedData || null,
        });
      }

      return { isSuccess: true };
    } catch (e: any) {
      throw e;
    }
  }
}
