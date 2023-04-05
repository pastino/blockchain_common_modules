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
import { ABI, AbiItem } from "../ABI";
import { LogError } from "../entities/LogError";
import { OpenseaCollection } from "../entities/OpenseaCollection";
import { CreateEntityData } from "./manufactureData";
import { BigNumber } from "ethers";

const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

const kakaoMessage = new Message();
const web3 = new Web3();

const eventSignatures = ABI.filter((item: any) => item.type === "event").map(
  (event: any) => web3.eth.abi.encodeEventSignature(event)
);

const functionSignatures = ABI.filter(
  (item: any) => item.type === "function"
).map((event: any) => web3.eth.abi.encodeFunctionSignature(event));

export const sleep = (sec: number) => {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
};

export const hexToStringValue = (hexValue: string) => {
  // BigNumber 객체를 생성
  const bigNumberValue = BigNumber.from(hexValue);

  // BigNumber 객체를 문자열 값으로 변환
  return bigNumberValue.toString();
};

async function getTransactionReceipt(
  transactionHash: string,
  retryCount: number = 10
): Promise<any> {
  try {
    const response = await alchemy.core.getTransactionReceipt(transactionHash);
    return response;
  } catch (e: any) {
    if (retryCount > 0) {
      await sleep(3);
      return getTransactionReceipt(transactionHash, retryCount - 1);
    } else {
      await kakaoMessage.sendMessage(
        `${moment(new Date()).format(
          "MM/DD HH:mm"
        )}\n\ntransactionReceipt error - getTransactionReceipt`
      );
      throw new Error(e);
    }
  }
}

async function getTransaction(
  transactionHash: string,
  retryCount: number = 10
): Promise<any> {
  try {
    const response = await alchemy.core.getTransaction(transactionHash);
    return response;
  } catch (e: any) {
    if (retryCount > 0) {
      await sleep(3);
      return getTransaction(transactionHash, retryCount - 1);
    } else {
      await kakaoMessage.sendMessage(
        `${moment(new Date()).format(
          "MM/DD HH:mm"
        )}\n\ntransaction error - getTransaction`
      );
      throw new Error(e);
    }
  }
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
        throw new Error(e);
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
      // console.log("createEntityData", createEntityData);
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
    gasPrice: hexToStringValue(transactionData?.gasPrice?._hex),
    gasLimit: hexToStringValue(transactionData?.gasLimit?._hex),
    value: hexToStringValue(transactionData?.value?._hex),
    logId: `${log.transactionHash}-${log.logIndex}`,
    ...timeOption,
  });
}

// async function decodeFunctionInput(transaction: any) {
//   const input = transaction.input;
//   let functionSignature: any = null;
//   try {
//     functionSignature = input.slice(0, 10);
//   } catch (e) {
//     null;
//   }

//   const functionAbi = ABI.find(
//     (item: AbiItem) =>
//       item.type === "function" &&
//       web3.eth.abi.encodeFunctionSignature(item) === functionSignature
//   );

//   if (!functionAbi || !functionAbi.inputs) {
//     return null;
//   }

//   const inputData = input.slice(10);
//   const decodedInput = web3.eth.abi.decodeParameters(
//     functionAbi.inputs,
//     inputData
//   );

//   return {
//     functionName: functionAbi.name,
//     data: decodedInput,
//   };
// }

async function processLogTest(log: Log) {
  for (const signature of eventSignatures) {
    if (log.topics[0] === signature) {
      try {
        const eventAbi = ABI.find(
          (item: AbiItem) =>
            web3.eth.abi.encodeEventSignature(item) === signature
        );

        if (!eventAbi || !eventAbi.inputs) {
          return null;
        }

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
        return null;
      }
    }
  }

  return null;
}

function generateABI(signature: string) {
  const inputTypes = signature
    .slice(signature.indexOf("(") + 1, signature.indexOf(")"))
    .split(",");

  const name = signature.slice(0, signature.indexOf("("));

  const abi = {
    name: name,
    type: "event",
    inputs: inputTypes.map((inputType, index) => ({
      type: inputType.trim(),
      name: `param${index}`,
    })),
  };

  return abi;
}

function decodeTransferEvent(log: any): any {
  const ERC20_TRANSFER_SIGNATURE =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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

  if (log.topics[0] === ERC20_TRANSFER_SIGNATURE && log.topics.length === 3) {
    return {
      type: "ERC20",
      from: web3.eth.abi.decodeParameter("address", log.topics[1]),
      to: web3.eth.abi.decodeParameter("address", log.topics[2]),
      value: web3.eth.abi.decodeParameter("uint256", log.data),
    };
  } else if (
    log.topics[0] === nftTransferEventSignature &&
    log.topics.length === 4
  ) {
    return {
      type: "ERC721",
      from: web3.eth.abi.decodeParameter("address", log.topics[1]),
      to: web3.eth.abi.decodeParameter("address", log.topics[2]),
      tokenId: web3.eth.abi.decodeParameter("uint256", log.topics[3]),
    };
  } else {
    return log;
  }
}

async function processLog({
  log,
  blockNumber,
  blockNumberData,
  transactionHash,
  blockData,
  transactionData,
}: {
  log: Log;
  blockNumber: number;
  blockNumberData: BlockNumber;
  transactionHash: string;
  blockData: any;
  transactionData: any;
}) {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const result = await decodeTransferEvent(log);
    return result;
    //   const nftTransferEventAbi: any = {
    //     anonymous: false,
    //     inputs: [
    //       {
    //         indexed: true,
    //         internalType: "address",
    //         name: "from",
    //         type: "address",
    //       },
    //       {
    //         indexed: true,
    //         internalType: "address",
    //         name: "to",
    //         type: "address",
    //       },
    //       {
    //         indexed: true,
    //         internalType: "uint256",
    //         name: "tokenId",
    //         type: "uint256",
    //       },
    //     ],
    //     name: "Transfer",
    //     type: "event",
    //   };
    //   const nftTransferEventAbi1: any = {
    //     anonymous: false,
    //     inputs: [
    //       {
    //         indexed: true,
    //         name: "from",
    //         type: "address",
    //       },
    //       {
    //         indexed: true,
    //         name: "to",
    //         type: "address",
    //       },
    //       {
    //         indexed: false,
    //         name: "value",
    //         type: "uint256",
    //       },
    //     ],
    //     name: "Transfer",
    //     type: "event",
    //   };
    //   const nftTransferEventSignature =
    //     web3.eth.abi.encodeEventSignature(nftTransferEventAbi);
    //   const nftTransferEventSignature1 =
    //     web3.eth.abi.encodeEventSignature(nftTransferEventAbi1);
    //   let decodedLog;
    //   if (log.topics[0] === nftTransferEventSignature) {
    //     try {
    //       decodedLog = web3.eth.abi.decodeLog(
    //         nftTransferEventAbi.inputs,
    //         log.data,
    //         log.topics.slice(1)
    //       );
    //     } catch (e) {
    //       null;
    //     }
    //   } else if (log.topics[0] === nftTransferEventSignature1) {
    //     console.log("erc20");
    //     try {
    //       decodedLog = web3.eth.abi.decodeLog(
    //         nftTransferEventAbi1.inputs,
    //         log.data,
    //         log.topics.slice(1)
    //       );
    //     } catch (e) {
    //       null;
    //     }
    //   } else {
    //     return;
    //   }
    //   if (decodedLog?.tokenId === undefined) return;
    //   const contract = await saveContract(log, queryRunner);
    //   const nft = await saveNFT(contract, decodedLog, queryRunner);
    //   const transferData = await saveTransfer({
    //     log,
    //     contract,
    //     nft,
    //     decodedLog,
    //     blockNumber,
    //     transactionHash,
    //     queryRunner,
    //   });
    //   const transaction = await saveTransaction({
    //     log,
    //     transactionData,
    //     blockData,
    //     blockNumberData,
    //     transferData,
    //     queryRunner,
    //   });
    //   await queryRunner.manager.update(
    //     Transfer,
    //     {
    //       id: transferData.id,
    //     },
    //     {
    //       transaction,
    //     }
    //   );
    //   await queryRunner.commitTransaction();
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

      const transactionData = await getTransaction(transactionHash);

      const transactionReceipt = await getTransactionReceipt(transactionHash);

      if (transactionReceipt?.logs) {
        const parsedLogs: any = [];
        for (let i = 0; i < transactionReceipt?.logs?.length; i++) {
          const log = transactionReceipt?.logs[i];

          // 트랜잭션 저장하고
          // 관련된 log들을 저장한다
          const parsedLogData = await processLog({
            log,
            blockNumber,
            blockNumberData,
            transactionHash,
            blockData,
            transactionData,
          });
          parsedLogs.push(parsedLogData);
        }
        console.log(transactionHash, parsedLogs);
      }
    }
    console.log("블록 데이터 생성 완료", blockNumber);
  } catch (e: any) {
    await kakaoMessage.sendMessage(
      `${moment(new Date()).format(
        "MM/DD HH:mm"
      )}\n\n블록 데이터 생성 실패 ${blockNumber}\n\n${e.message}`
    );
    await getRepository(BlockNumber).delete({ blockNumber });
    await getRepository(LogError).save({ blockNumber });
    console.log(e);
  }
}
