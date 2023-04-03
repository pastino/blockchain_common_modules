import { Alchemy, Network, Log } from "alchemy-sdk";
import { getConnection, QueryRunner } from "typeorm";
import { BlockNumber } from "../entities/BlockNumber";
import Web3 from "web3";
import { Contract } from "../entities/Contract";
import { NFT } from "../entities/NFT";
import { Transfer } from "../entities/Transfer";
import { Transaction } from "../entities/Transaction";
import { Message } from "./kakao";
import moment from "moment";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const kakaoMessage = new Message();

export const hexToDecimal = (hexValue: string) => {
  return parseInt(hexValue, 16);
};

async function getTransactionReceipt(transactionHash: string) {
  return await alchemy.core.getTransactionReceipt(transactionHash);
}

async function saveContract(log: Log, queryRunner: QueryRunner) {
  let contract = await queryRunner.manager.findOne(Contract, {
    where: {
      address: log.address,
    },
  });

  if (!contract) {
    const contractMetaData = await alchemy.nft.getContractMetadata(log.address);

    const newContract = {
      ...contractMetaData,
      ...contractMetaData.openSea,
      name: contractMetaData.name || contractMetaData.openSea?.collectionName,
      isCompletedInitialUpdate: false,
      isCompletedUpdate: false,
    };
    delete contractMetaData.openSea;

    try {
      contract = await queryRunner.manager.save(Contract, newContract);
    } catch (e: any) {
      if (e.code === "23505") {
        contract = await queryRunner.manager.findOne(Contract, {
          where: {
            address: log.address,
          },
        });
      } else {
        console.error("Unexpected error:", e);
      }
    }
  }
  if (!contract) {
    throw new Error(
      `Failed to find or save contract with address: ${log.address}`
    );
  }
  return contract;
}

async function saveNFT(
  contract: Contract,
  decodedLog: any,
  queryRunner: QueryRunner
) {
  let nft = await queryRunner.manager.findOne(NFT, {
    where: {
      contract,
      tokenId: decodedLog?.tokenId,
    },
  });
  if (!nft) {
    const nftData = await alchemy.nft.getNftMetadata(
      contract.address,
      decodedLog?.tokenId
    );
    nft = await queryRunner.manager.save(NFT, {
      ...nftData,
      mediaThumbnail: nftData?.media?.[0]?.thumbnail,
      contract,
    });
  }
  return nft;
}

async function saveTransfer({
  contract,
  nft,
  decodedLog,
  blockNumber,
  transactionHash,
  queryRunner,
}: {
  contract: Contract;
  nft: NFT;
  decodedLog: any;
  blockNumber: number;
  transactionHash: string;
  queryRunner: QueryRunner;
}) {
  return await queryRunner.manager.save(Transfer, {
    from: decodedLog?.from,
    to: decodedLog?.to,
    blockNumber,
    tokenId: decodedLog?.tokenId,
    tokenType: nft?.tokenType,
    contract,
    nft,
    title: nft?.title,
    transactionHash,
  });
}

async function saveTransaction({
  transactionData,
  blockData,
  blockNumberData,
  transferData,
  queryRunner,
}: {
  transactionData: any;
  blockData: any;
  blockNumberData: BlockNumber;
  transferData: Transfer;
  queryRunner: QueryRunner;
}) {
  const timestamp = blockData.timestamp;
  const eventTime = new Date(timestamp * 1000);

  const timeOption = {
    timestamp,
    eventTime,
  };

  return await queryRunner.manager.save(Transaction, {
    ...transactionData,
    blockNumber: blockNumberData,
    transfer: transferData,
    gasPrice: String(hexToDecimal(transactionData?.gasPrice?._hex || "0")),
    gasLimit: String(hexToDecimal(transactionData?.gasLimit?._hex || "0")),
    value: String(hexToDecimal(transactionData?.value?._hex || "0")),
    ...timeOption,
  });
}

async function processLog({
  log,
  blockNumber,
  blockNumberData,
  transactionHash,
  blockData,
  queryRunner,
}: {
  log: Log;
  blockNumber: number;
  blockNumberData: BlockNumber;
  transactionHash: string;
  blockData: any;
  queryRunner: QueryRunner;
}) {
  const web3 = new Web3();

  const nftTransferEventAbi: any = {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  };

  const nftTransferEventSignature =
    web3.eth.abi.encodeEventSignature(nftTransferEventAbi);

  if (log.topics[0] === nftTransferEventSignature) {
    try {
      let decodedLog;

      try {
        decodedLog = web3.eth.abi.decodeLog(
          nftTransferEventAbi.inputs,
          log.data,
          log.topics.slice(1)
        );
      } catch (decodeError) {
        // log.topics.slice(1) 이부분에서 에러가 발생하는 경우는 NFT Transfer가 아닌경우로 무시한다.
        null;
      }
      if (decodedLog?.tokenId === undefined) return;
      const contract = await saveContract(log, queryRunner);
      const nft = await saveNFT(contract, decodedLog, queryRunner);
      const transferData = await saveTransfer({
        contract,
        nft,
        decodedLog,
        blockNumber,
        transactionHash,
        queryRunner,
      });
      const transactionData = await alchemy.transact.getTransaction(
        transactionHash
      );
      const transaction = await saveTransaction({
        transactionData,
        blockData,
        blockNumberData,
        transferData,
        queryRunner,
      });
      await queryRunner.manager.update(
        Transfer,
        {
          id: transferData.id,
        },
        {
          transaction,
        }
      );
    } catch (e) {
      console.error("Error processing log:", e);
    }
  }
}

async function performTransactionWithRetry(
  callback: Function,
  queryRunner: QueryRunner,
  retryCount = 3,
  delay = 500
) {
  let lastError;

  for (let i = 0; i < retryCount; i++) {
    try {
      return await callback(queryRunner);
    } catch (error: any) {
      if (error.code === "ER_LOCK_WAIT_TIMEOUT") {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function handleBlockEvent(blockNumber: number) {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();

  try {
    await performTransactionWithRetry(async (queryRunner: QueryRunner) => {
      await queryRunner.startTransaction();

      const existingBlock = await queryRunner.manager.findOne(BlockNumber, {
        where: {
          blockNumber,
        },
      });

      if (existingBlock) return;

      const blockNumberData = await queryRunner.manager.save(BlockNumber, {
        blockNumber,
      });

      const blockData = await alchemy.core.getBlock(blockNumber);

      const transactions = blockData?.transactions;

      for (let i = 0; i < transactions.length; i++) {
        const transactionHash = transactions[i];

        const transactionReceipt = await getTransactionReceipt(transactionHash);

        if (transactionReceipt?.logs) {
          for (let i = 0; i < transactionReceipt?.logs?.length; i++) {
            const log = transactionReceipt?.logs[i];

            await processLog({
              log,
              blockNumber,
              blockNumberData,
              transactionHash,
              blockData,
              queryRunner,
            });
          }
        }
      }

      if (IS_PRODUCTION) {
        await queryRunner.commitTransaction();
      }
      console.log("블록 데이터 생성", blockNumber);
    }, queryRunner);
  } catch (e: any) {
    await kakaoMessage.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n블록 데이터 생성 실패 ${blockNumber}\n\n${e.message}`
    );
    console.log(e);
  } finally {
    await queryRunner.release();
  }
}
