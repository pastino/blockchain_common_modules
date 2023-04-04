import { Alchemy, Network, Log } from "alchemy-sdk";
import { getConnection, getRepository, QueryRunner } from "typeorm";
import { BlockNumber } from "../entities/BlockNumber";
import Web3 from "web3";
import { Contract } from "../entities/Contract";
import { NFT } from "../entities/NFT";
import { Transfer } from "../entities/Transfer";
import { Transaction } from "../entities/Transaction";
import { Message } from "./kakao";
import moment from "moment";
import axios, { AxiosResponse } from "axios";
import { ABI } from "../ABI";
import { LogError } from "../entities/LogError";
import { sleep } from "../../utils";
import { OpenseaCollection } from "../entities/OpenseaCollection";
import { CreateEntityData } from "./manufactureData";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const kakaoMessage = new Message();
const web3 = new Web3();
const eventSignatures = ABI.filter((item: any) => item.type === "event").map(
  (event: any) => web3.eth.abi.encodeEventSignature(event)
);

export const hexToDecimal = (hexValue: string) => {
  return parseInt(hexValue, 16);
};

async function getTransactionReceipt(transactionHash: string) {
  return await alchemy.core.getTransactionReceipt(transactionHash);
}

export const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

const handleOpenseaContract = async (
  contractAddress: string,
  retryCount: number = 10
): Promise<AxiosResponse | undefined> => {
  try {
    const response = await axios.get(
      `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`,
      openSeaConfig
    );
    return response;
  } catch (e: any) {
    if (e.response && e.response.status !== 404) {
      if (retryCount > 0) {
        await sleep(3);
        return handleOpenseaContract(contractAddress, retryCount - 1);
      } else {
        await kakaoMessage.sendMessage(
          `${moment(new Date()).format(
            "MM/DD HH:mm"
          )}\n\nopensea error - handleOpenseaContract`
        );
        console.error(
          `Failed to fetch asset_contract after ${10} retries. Error: `,
          e
        );
      }
    }
  }
};

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
    };
    delete contractMetaData.openSea;

    try {
      contract = await queryRunner.manager.save(Contract, newContract);
      const openseaData = await handleOpenseaContract(contract.address);
      const createEntityData = new CreateEntityData({
        snakeObject: openseaData?.data?.collection,
        entity: OpenseaCollection,
        filterList: ["id"],
      });
      const openseaCollection = await queryRunner.manager.save(
        OpenseaCollection,
        {
          ...createEntityData.createTableRowData(),
          contract,
        }
      );
      await queryRunner.manager.update(
        Contract,
        {
          id: contract.id,
        },
        {
          openseaCollection,
        }
      );
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
  try {
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

      try {
        nft = await queryRunner.manager.save(NFT, {
          ...nftData,
          mediaThumbnail: nftData?.media?.[0]?.thumbnail,
          contract,
        });
      } catch (e: any) {
        if (e.code === "23505") {
          nft = await queryRunner.manager.findOne(NFT, {
            where: {
              contract,
              tokenId: decodedLog?.tokenId,
            },
          });
        } else {
          console.error("Unexpected error:", e);
        }
      }
    }
    if (!nft) {
      throw new Error(`Failed to find or save nft: ${decodedLog}`);
    }
    return nft;
  } catch (e: any) {
    throw new Error(e);
  }
}

async function saveTransfer({
  log,
  contract,
  nft,
  decodedLog,
  blockNumber,
  transactionHash,
  queryRunner,
}: {
  log: Log;
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
    logId: `${log.transactionHash}-${log.logIndex}`,
  });
}

async function saveTransaction({
  log,
  transactionData,
  blockData,
  blockNumberData,
  transferData,
  queryRunner,
}: {
  log: Log;
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
    logId: `${log.transactionHash}-${log.logIndex}`,
    ...timeOption,
  });
}

async function processLogTest(log: any) {
  for (const signature of eventSignatures) {
    if (log.topics[0] === signature) {
      try {
        const eventAbi = ABI.find(
          (item: any) => web3.eth.abi.encodeEventSignature(item) === signature
        );

        const decodedLog = web3.eth.abi.decodeLog(
          eventAbi.inputs,
          log.data,
          log.topics.slice(1)
        );

        return {
          eventName: eventAbi.name,
          data: decodedLog,
        };
      } catch (error) {
        // console.error("Error decoding log:", error);
        return null;
      }
    }
  }
  return null;
}

async function processLog({
  log,
  blockNumber,
  blockNumberData,
  transactionHash,
  blockData,
}: {
  log: Log;
  blockNumber: number;
  blockNumberData: BlockNumber;
  transactionHash: string;
  blockData: any;
}) {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
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
      let decodedLog;

      try {
        decodedLog = web3.eth.abi.decodeLog(
          nftTransferEventAbi.inputs,
          log.data,
          log.topics.slice(1)
        );
      } catch (decodeError) {
        // log.topics.slice(1) 이부분에서 에러가 발생하는 경우는 NFT Transfer가 아닌경우로 무시한다.
        return;
      }

      if (decodedLog?.tokenId === undefined) return;

      const contract = await saveContract(log, queryRunner);
      const nft = await saveNFT(contract, decodedLog, queryRunner);

      const transferData = await saveTransfer({
        log,
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
        log,
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
    }
    if (IS_PRODUCTION) {
      await queryRunner.commitTransaction();
    }
  } catch (e: any) {
    await getRepository(LogError).save({
      blockNumber,
      logId: `${log.transactionHash}-${log.logIndex}`,
      transactionHash,
    });

    await kakaoMessage.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n블록 데이터 생성 실패 ${blockNumber}\n\n${e.message}`
    );
    await queryRunner.rollbackTransaction();
    console.log(e);
  } finally {
    await queryRunner.release();
  }
}

export async function handleBlockEvent(blockNumber: number) {
  try {
    const existingBlock = await getRepository(BlockNumber).findOne({
      where: {
        blockNumber,
      },
    });

    if (existingBlock) return;

    const blockNumberData = await getRepository(BlockNumber).save({
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
          });
        }
      }
    }
    console.log("블록 데이터 생성 완료", blockNumber);
  } catch (e: any) {
    await kakaoMessage.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n블록 데이터 생성 실패 ${blockNumber}\n\n${e.message}`
    );
    console.log(e);
  }
}

// async function performTransactionWithRetry(
//   callback: Function,
//   queryRunner: QueryRunner,
//   retryCount = 3,
//   delay = 500
// ) {
//   let lastError;

//   for (let i = 0; i < retryCount; i++) {
//     try {
//       return await callback(queryRunner);
//     } catch (error: any) {
//       if (error.code === "ER_LOCK_WAIT_TIMEOUT") {
//         lastError = error;
//         await new Promise((resolve) => setTimeout(resolve, delay));
//       } else {
//         throw error;
//       }
//     }
//   }

//   throw lastError;
// }
