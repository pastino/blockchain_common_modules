import Web3 from "web3";
import { Action } from "./modules/decodeLog";
import {
  OrderFulfilledEvent,
  ReceivedItem,
  SEAPORT_ITEM_TYPE,
} from "./seportTypes";
import {
  BLUR_TYPE,
  checkIsAddress,
  findTargetLogFromTo,
  unpackCollectionPriceSide,
  unpackTokenIdListingIndexTrader,
  X2Y2_TYPE,
} from "./utils";
import { getRepository } from "typeorm";
import { DecodeError } from "./entities/DecodeError";

const web3 = new Web3();

export interface SaleInterface {
  action: Action;
  contract: string;
  tokenId: string;
  from: string;
  to: string;
  ethValue: number;
  unit: string;
  value: number;
  platform: string;
  quantity: number;
  data: { [key: string]: any } | null;
}

export interface TransferInterface {
  action: Action;
  from: string;
  to: string;
  tokenId: string;
}

export interface MintInterface {
  action: Action;
  contract: string;
  minterAddress: string;
  stage: number;
  mintCount: number;
}

export type DecodedLogType = SaleInterface | TransferInterface | MintInterface;

interface Log {
  address: string;
  topics: string[];
  data: string;
}

export async function getIsERC721Event(
  log: Log,
  logs: Log[],
  blockNumber: number,
  transactionHash: string
) {
  const { address, topics, data } = log;
  const hexSignature = topics[0];

  const signature = SALE_HEX_SIGNATURE_LIST.find(
    (item) => item.hexSignature === hexSignature
  );

  if (signature) {
    const decodedData = await signature.decode({
      address,
      topics,
      data,
      log,
      logs,
      blockNumber,
      transactionHash,
    });
    if (decodedData) {
      return { isERC721Event: true, decodedData };
    }
  }
  return { isERC721Event: false };
}

export const SALE_HEX_SIGNATURE_LIST = [
  {
    hexSignature:
      "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log?: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<SaleInterface | null | undefined> => {
      try {
        const decodedData: any = web3.eth.abi.decodeParameters(
          [
            "bytes32",
            "address",
            {
              type: "tuple[]",
              components: [
                { type: "uint8" },
                { type: "address" },
                { type: "uint256" },
                { type: "uint256" },
              ],
            },
            {
              type: "tuple[]",
              components: [
                { type: "uint8" },
                { type: "address" },
                { type: "uint256" },
                { type: "uint256" },
                { type: "address" },
              ],
            },
          ],
          data
        );

        const orderFulfilledEvent: OrderFulfilledEvent = {
          offerer: topics[1]
            ? web3.eth.abi.decodeParameter("address", topics[1])
            : "",
          zone: topics[2]
            ? web3.eth.abi.decodeParameter("address", topics[2])
            : "",
          orderHash: decodedData[0] as any,
          recipient: decodedData[1] as any,
          offer: decodedData[2].map((item: any) => {
            return {
              itemType: item[0],
              token: item[1],
              identifier: item[2],
              amount: item[3],
            };
          }),
          consideration: decodedData[3].map((item: any) => {
            return {
              itemType: item[0],
              token: item[1],
              identifier: item[2],
              amount: item[3],
              recipient: item[4],
            };
          }),
        };

        // if (orderFulfilledEvent?.offer?.length > 1) {
        //   console.log("orderFulfilledEvent", orderFulfilledEvent);
        // }

        const offer = orderFulfilledEvent?.offer[0];
        const isERC721 = offer.itemType == SEAPORT_ITEM_TYPE["ERC721"];
        const isERC20 = offer.itemType == SEAPORT_ITEM_TYPE["ERC20"];
        const isERC1155 = offer.itemType == SEAPORT_ITEM_TYPE["ERC1155"];

        if (isERC721 || isERC1155) {
          const natives = orderFulfilledEvent.consideration.filter(
            (item) => item.itemType == SEAPORT_ITEM_TYPE["NATIVE"]
          );

          if (natives.length === 0) return null;

          const value = natives?.reduce(
            (sum: number, transaction: ReceivedItem) => {
              let value = Number(transaction.amount) / 10 ** 18;
              return sum + value;
            },
            0
          );

          let ethValue = value;
          let unit = "ETH";

          switch (orderFulfilledEvent?.consideration?.[0]?.token) {
            case "0x64D91f12Ece7362F91A6f8E7940Cd55F05060b92":
              const ashToEthRate = 0.00045211;
              ethValue = value * ashToEthRate;
              unit = "ASH";
              break;
            case "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2":
            case "0x79f1C4cF7266746698E91034d658E56913E6644f":
            case "0xED5AF388653567Af2F388E6224dC7C4b3241C544":
              unit = "WETH";
              break;
            default:
              break;
          }

          return {
            action: "Sale",
            contract: offer?.token,
            tokenId: offer?.identifier,
            from: orderFulfilledEvent?.offerer,
            to: orderFulfilledEvent?.recipient,
            ethValue,
            unit,
            value,
            platform: "OpenSea",
            quantity: Number(offer?.amount),
            data: orderFulfilledEvent,
          };
        } else if (isERC20) {
          const value = offer?.amount / 10 ** 18;

          let ethValue = value;
          let unit = "ETH";

          const target = orderFulfilledEvent?.consideration.find(
            (item) => item.itemType == SEAPORT_ITEM_TYPE["ERC721"]
          );
          if (!target) return null;

          return {
            action: "Sale",
            contract: target?.token,
            tokenId: String(target?.identifier),
            from: orderFulfilledEvent?.recipient,
            to: orderFulfilledEvent?.offerer,
            ethValue,
            unit,
            value,
            platform: "OpenSea",
            quantity: Number(target?.amount),
            data: orderFulfilledEvent,
          };
        }
        return null;
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log?: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<SaleInterface | undefined> => {
      try {
        const hexString: any = data.slice(2).match(/.{1,64}/g);
        const decodedData = hexString.map((chunk: any, index: number) => {
          const type = BLUR_TYPE[index];
          if (!type) {
            return chunk;
          }
          if (type === "hex") {
            return chunk;
          }

          const data = web3.eth.abi.decodeParameter(type, chunk);
          return data;
        });

        const contract = decodedData?.[7];
        const value = Number(decodedData?.[11]) / 10 ** 18;
        const tokenId = decodedData?.[8];

        const from: any = topics[1]
          ? web3.eth.abi.decodeParameter("address", topics[1])
          : "";
        const to: any = topics[2]
          ? web3.eth.abi.decodeParameter("address", topics[2])
          : "";
        const quantity = Number(decodedData?.[9]);
        return {
          action: "Sale",
          contract,
          tokenId,
          from,
          to,
          ethValue: value,
          unit: "ETH",
          value,
          platform: "Blur",
          quantity,
          data: decodedData,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0x0fcf17fac114131b10f37b183c6a60f905911e52802caeeb3e6ea210398b81ab",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log?: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<SaleInterface | undefined> => {
      try {
        const BLUR_ABI = {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "bytes32",
              name: "orderHash",
              type: "bytes32",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "tokenIdListingIndexTrader",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "collectionPriceSide",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "takerFeeRecipientRate",
              type: "uint256",
            },
          ],
          name: "Execution721TakerFeePacked",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          BLUR_ABI.inputs,
          data
        );

        const { tokenId } = unpackTokenIdListingIndexTrader(
          BigInt(decodedData.tokenIdListingIndexTrader)
        );

        const { price, collection } = unpackCollectionPriceSide(
          BigInt(decodedData.collectionPriceSide)
        );

        const value = Number(price) / 10 ** 18;

        const fromToData = findTargetLogFromTo(String(tokenId), logs);
        if (!fromToData) return;
        const { from, to } = fromToData;

        return {
          action: "Sale",
          contract: collection,
          tokenId: String(tokenId),
          from,
          to,
          ethValue: value,
          unit: "ETH",
          value,
          platform: "Blur",
          quantity: 1,
          data: decodedData,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x0fcf17fac114131b10f37b183c6a60f905911e52802caeeb3e6ea210398b81ab`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x0fcf17fac114131b10f37b183c6a60f905911e52802caeeb3e6ea210398b81ab",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0x7dc5c0699ac8dd5250cbe368a2fc3b4a2daadb120ad07f6cccea29f83482686e",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log?: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<SaleInterface | undefined> => {
      try {
        const BLUR_ABI = {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "bytes32",
              name: "orderHash",
              type: "bytes32",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "tokenIdListingIndexTrader",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "collectionPriceSide",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "makerFeeRecipientRate",
              type: "uint256",
            },
          ],
          name: "Execution721MakerFeePacked",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          BLUR_ABI.inputs,
          data
        );

        const { tokenId } = unpackTokenIdListingIndexTrader(
          BigInt(decodedData.tokenIdListingIndexTrader)
        );

        const { price, collection } = unpackCollectionPriceSide(
          BigInt(decodedData.collectionPriceSide)
        );

        const value = Number(price) / 10 ** 18;

        const fromToData = findTargetLogFromTo(String(tokenId), logs);
        if (!fromToData) return;
        const { from, to } = fromToData;

        return {
          action: "Sale",
          contract: collection,
          tokenId: String(tokenId),
          from,
          to,
          ethValue: value,
          unit: "ETH",
          value,
          platform: "Blur",
          quantity: 1,
          data: decodedData,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x7dc5c0699ac8dd5250cbe368a2fc3b4a2daadb120ad07f6cccea29f83482686e`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x7dc5c0699ac8dd5250cbe368a2fc3b4a2daadb120ad07f6cccea29f83482686e",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0x1d5e12b51dee5e4d34434576c3fb99714a85f57b0fd546ada4b0bddd736d12b2",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
      transactionHash,
    }: {
      address: string;
      topics: string[];
      data: string;
      log?: any;
      logs: Log[];
      blockNumber: number;
      transactionHash: string;
    }): Promise<SaleInterface | undefined> => {
      try {
        const BLUR_ABI = {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "bytes32",
              name: "orderHash",
              type: "bytes32",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "tokenIdListingIndexTrader",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "collectionPriceSide",
              type: "uint256",
            },
          ],
          name: "Execution721Packed",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          BLUR_ABI.inputs,
          data
        );

        const { tokenId } = unpackTokenIdListingIndexTrader(
          BigInt(decodedData.tokenIdListingIndexTrader)
        );
        const { price, collection } = unpackCollectionPriceSide(
          BigInt(decodedData.collectionPriceSide)
        );

        // 해당 시그니처에서는 from, to 주소를 찾을 수 없어, 트랜잭션의 trnsfer 데이터로 from, to 주소를 찾는다.
        const fromToData = findTargetLogFromTo(String(tokenId), logs);

        if (!fromToData) return;
        const { from, to } = fromToData;

        const value = Number(price) / 10 ** 18;

        return {
          action: "Sale",
          contract: collection,
          tokenId: String(tokenId),
          from,
          to,
          ethValue: value,
          unit: "ETH",
          value,
          platform: "Blur",
          quantity: 1,
          data: decodedData,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x1d5e12b51dee5e4d34434576c3fb99714a85f57b0fd546ada4b0bddd736d12b2`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x1d5e12b51dee5e4d34434576c3fb99714a85f57b0fd546ada4b0bddd736d12b2",
          data,
        });
      }
    },
  },

  {
    hexSignature:
      "0x3ee3de4684413690dee6fff1a0a4f92916a1b97d1c5a83cdf24671844306b2e3",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
      transactionHash,
    }: {
      address: string;
      topics: string[];
      data: string;
      log: any;
      logs: Log[];
      blockNumber: number;
      transactionHash: string;
    }): Promise<SaleInterface | any> => {
      try {
        const LOOKSRARE_ABI = {
          anonymous: false,
          inputs: [
            {
              components: [
                { internalType: "bytes32", name: "orderHash", type: "bytes32" },
                {
                  internalType: "uint256",
                  name: "orderNonce",
                  type: "uint256",
                },
                {
                  internalType: "bool",
                  name: "isNonceInvalidated",
                  type: "bool",
                },
              ],
              indexed: false,
              internalType:
                "struct ILooksRareProtocol.NonceInvalidationParameters",
              name: "nonceInvalidationParameters",
              type: "tuple",
            },
            {
              indexed: false,
              internalType: "address",
              name: "bidUser",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "bidRecipient",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "strategyId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "address",
              name: "currency",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "collection",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256[]",
              name: "itemIds",
              type: "uint256[]",
            },
            {
              indexed: false,
              internalType: "uint256[]",
              name: "amounts",
              type: "uint256[]",
            },
            {
              indexed: false,
              internalType: "address[2]",
              name: "feeRecipients",
              type: "address[2]",
            },
            {
              indexed: false,
              internalType: "uint256[3]",
              name: "feeAmounts",
              type: "uint256[3]",
            },
          ],
          name: "TakerBid",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          LOOKSRARE_ABI.inputs,
          data
        );

        const contract = decodedData?.collection;
        let sum = BigInt(0);
        const feeAmounts = decodedData?.feeAmounts;
        for (let i = 0; i < feeAmounts.length; i++) {
          sum += BigInt(feeAmounts[i]);
        }
        const value = Number(sum) / 10 ** 18;

        const tokenId = decodedData.itemIds?.[0];
        const from: any = decodedData.feeRecipients?.[0];
        const to: any = decodedData.bidRecipient;
        const quantity = Number(decodedData.amounts?.[0]);

        return {
          action: "Sale",
          contract,
          tokenId,
          from,
          to,
          ethValue: value,
          unit: "ETH",
          value,
          platform: "LooksRare",
          quantity,
          data: decodedData,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x3ee3de4684413690dee6fff1a0a4f92916a1b97d1c5a83cdf24671844306b2e3`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x3ee3de4684413690dee6fff1a0a4f92916a1b97d1c5a83cdf24671844306b2e3",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0x3cbb63f144840e5b1b0a38a7c19211d2e89de4d7c5faf8b2d3c1776c302d1d33",
    action: "Sale",
    decode: async ({
      topics,
      data,
      log,
      logs,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<SaleInterface | undefined> => {
      try {
        const hexString: any = data.slice(2).match(/.{1,64}/g);
        const decodedData = hexString.map((chunk: any, index: number) => {
          const type = X2Y2_TYPE[index];
          if (!type) {
            return chunk;
          }
          if (type === "hex") {
            return chunk;
          }
          const data = web3.eth.abi.decodeParameter(type, chunk);
          return data;
        });

        const contract = decodedData?.[17];
        const value = Number(decodedData?.[12]) / 10 ** 18;
        const tokenId = decodedData?.[18];
        const from: any = decodedData?.[0];
        const to: any = decodedData?.[1];

        const quantity = Number(decodedData?.[16]);
        return {
          action: "Sale",
          contract,
          tokenId,
          from,
          to,
          ethValue: value,
          unit: "ETH",
          value,
          platform: "X2Y2",
          quantity,
          data: decodedData,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0x3cbb63f144840e5b1b0a38a7c19211d2e89de4d7c5faf8b2d3c1776c302d1d33`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x3cbb63f144840e5b1b0a38a7c19211d2e89de4d7c5faf8b2d3c1776c302d1d33",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    action: "Transfer",
    decode: async ({
      address,
      topics,
      data,
      logs,
      log,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<any> => {
      try {
        if (topics.length <= 3) return;

        const fromAddress = web3.eth.abi.decodeParameter("address", topics[1]);
        const actionType =
          fromAddress.toLowerCase() ===
          "0x0000000000000000000000000000000000000000"
            ? "Mint"
            : "Transfer";

        return {
          action: actionType,
          contract: address,
          quantity: 1,
          tokenId: web3.eth.abi.decodeParameter("uint256", topics[3]) as any,
          from: fromAddress,
          to: web3.eth.abi.decodeParameter("address", topics[2]) as any,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          data,
        });
      }
    },
  },
  {
    hexSignature:
      "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
    action: "TransferSingle",
    decode: async ({
      address,
      topics,
      log,
      logs,
      data,
      blockNumber,
    }: {
      address: string;
      topics: string[];
      data: string;
      log: any;
      logs: Log[];
      blockNumber: number;
    }): Promise<any> => {
      try {
        const decodedData: any = web3.eth.abi.decodeParameters(
          ["uint256", "uint256"],
          data
        );

        const tokenId = decodedData?.[0];
        const quantity = decodedData?.[1];

        const fromAddress = web3.eth.abi.decodeParameter("address", topics[2]);
        const actionType =
          fromAddress.toLowerCase() ===
          "0x0000000000000000000000000000000000000000"
            ? "Mint"
            : "Transfer";

        return {
          action: actionType,
          contract: address,
          tokenId,
          quantity,
          from: fromAddress,
          to: web3.eth.abi.decodeParameter("address", topics[3]) as any,
        };
      } catch (e) {
        console.log(
          e,
          "Log Decode Error",
          `시그니처 - 0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
          data,
        });
      }
    },
  },
  // {
  //   hexSignature:
  //     "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f",
  //   action: "Mint",
  //   decode: async ({
  //     topics,
  //     address,
  //     data,
  //     logs,
  //     blockNumber,
  //   }: {
  //     address: string;
  //     topics: string[];
  //     data: string;
  //     logs: Log[];
  //     blockNumber: number;
  //   }): Promise<any> => {
  //     try {
  //       if (topics.length === 2) return;

  //       if (topics.length === 4) {
  //         return {
  //           action: "Mint",
  //           contract: address,
  //           minterAddress: web3.eth.abi.decodeParameter("address", topics[1]),
  //           stage: web3.eth.abi.decodeParameter("uint256", topics[2]),
  //           mintCount: web3.eth.abi.decodeParameter("uint256", topics[3]),
  //         };
  //       }

  //       const decodedData: any = web3.eth.abi.decodeParameters(
  //         ["address", "uint256", "uint256"],
  //         data
  //       );

  //       if (decodedData[2] > 1000000000) {
  //         if (typeof decodedData[1] !== "number") return;
  //         return {
  //           action: "Mint",
  //           contract: address,
  //           minterAddress: decodedData[0],
  //           stage: "",
  //           mintCount: decodedData[1],
  //         };
  //       }

  //       return {
  //         action: "Mint",
  //         contract: address,
  //         minterAddress: decodedData[0],
  //         stage: decodedData[1],
  //         mintCount: decodedData[2],
  //       };
  //     } catch (e) {
  //       console.log(
  //         e,
  //         "Log Decode Error",
  //         `시그니처 - 0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f`,
  //         `blockNumber - ${blockNumber}`
  //       );
  //       await getRepository(DecodeError).save({
  //         blockNumber,
  //         signature:
  //           "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f",
  //         data,
  //       });
  //     }
  //   },
  // },
];

export const SIGNATURE_LIST = [
  {
    hexSignature:
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    textSignature:
      "Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)",
    functionName: "Transfer",
    type: "ERC20",
    indexLength: 2,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Transfer",
        type: "ERC20",
        from: web3.eth.abi.decodeParameter("address", topics[1]),
        to: web3.eth.abi.decodeParameter("address", topics[2]),
        value: web3.eth.abi.decodeParameter("uint256", data),
      };
    },
  },
  {
    hexSignature:
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    textSignature:
      "Approval (index_topic_1 address owner, index_topic_2 address spender, uint256 value)",
    functionName: "Approval",
    type: "ERC20",
    indexLength: 2,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Approval",
        type: "ERC20",
        owner: web3.eth.abi.decodeParameter("address", topics[1]),
        spender: web3.eth.abi.decodeParameter("address", topics[2]),
        value: web3.eth.abi.decodeParameter("uint256", data),
      };
    },
  },

  {
    hexSignature:
      "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1",
    textSignature: "Sync (uint112 reserve0, uint112 reserve1)",
    functionName: "Sync",
    type: "ERC20",
    indexLength: 0,
    function: ({
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Sync",
        type: "ERC20",
        reserve0: web3.eth.abi.decodeParameters(
          ["uint112", "uint112"],
          data
        )[0],
        reserve1: web3.eth.abi.decodeParameters(
          ["uint112", "uint112"],
          data
        )[1],
      };
    },
  },
  {
    hexSignature:
      "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
    textSignature:
      "Swap (index_topic_1 address sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, index_topic_2 address to)",
    functionName: "Swap",
    type: "ERC20",
    indexLength: 2,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Swap",
        type: "ERC20",
        sender: web3.eth.abi.decodeParameter("address", topics[1]),
        to: web3.eth.abi.decodeParameter("address", topics[2]),
        amount0In: web3.eth.abi.decodeParameters(
          ["uint256", "uint256", "uint256", "uint256"],
          data
        )[0],
        amount1In: web3.eth.abi.decodeParameters(
          ["uint256", "uint256", "uint256", "uint256"],
          data
        )[1],
        amount0Out: web3.eth.abi.decodeParameters(
          ["uint256", "uint256", "uint256", "uint256"],
          data
        )[2],
        amount1Out: web3.eth.abi.decodeParameters(
          ["uint256", "uint256", "uint256", "uint256"],
          data
        )[3],
      };
    },
  },
  {
    hexSignature:
      "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65",
    textSignature: "Withdrawal (index_topic_1 address src, uint256 wad)",
    functionName: "Withdrawal",
    type: "ERC20",
    indexLength: 1,
    function: ({
      address,
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Withdrawal",
        type: "ERC20",
        src: web3.eth.abi.decodeParameter("address", topics[1]),
        wad: web3.eth.abi.decodeParameter("uint256", data),
      };
    },
  },
  {
    hexSignature:
      "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
    textSignature: "Deposit (index_topic_1 address dst, uint256 wad)",
    functionName: "Deposit",
    type: "ERC20",
    indexLength: 1,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Deposit",
        type: "ERC20",
        dst: web3.eth.abi.decodeParameter("address", topics[1]),
        wad: web3.eth.abi.decodeParameter("uint256", data),
      };
    },
  },
  {
    hexSignature:
      "0xb9ed0243fdf00f0545c63a0af8850c090d86bb46682baec4bf3c496814fe4f02",
    textSignature:
      "OrderFilled (index_topic_1 address maker, bytes32 orderHash, uint256 remaining)",
    functionName: "OrderFilled",
    type: "ERC20",
    indexLength: 1,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "OrderFilled",
        type: "ERC20",
        maker: web3.eth.abi.decodeParameter("address", topics[1]),
        orderHash: web3.eth.abi.decodeParameters(
          ["bytes32", "uint256"],
          data
        )[0],
        remaining: web3.eth.abi.decodeParameters(
          ["bytes32", "uint256"],
          data
        )[1],
      };
    },
  },
  {
    hexSignature:
      "0xdec2bacdd2f05b59de34da9b523dff8be42e5e38e818c82fdb0bae774387a724",
    textSignature:
      "DelegateVotesChanged (index_topic_1 address delegate, uint256 previousBalance, uint256 newBalance)",
    functionName: "DelegateVotesChanged",
    type: "ERC20",
    indexLength: 1,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "DelegateVotesChanged",
        type: "ERC20",
        delegate: web3.eth.abi.decodeParameter("address", topics[1]),
        previousBalance: web3.eth.abi.decodeParameters(
          ["uint256", "uint256"],
          data
        )[0],
        newBalance: web3.eth.abi.decodeParameters(
          ["uint256", "uint256"],
          data
        )[1],
      };
    },
  },
  {
    hexSignature:
      "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
    textSignature:
      "Swap (index_topic_1 address sender, index_topic_2 address recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
    functionName: "Swap",
    type: "ERC20",
    indexLength: 2,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Swap",
        type: "ERC20",
        sender: web3.eth.abi.decodeParameter("address", topics[1]),
        recipient: web3.eth.abi.decodeParameter("address", topics[2]),
        amount0: web3.eth.abi.decodeParameters(
          ["int256", "int256", "uint160", "uint128", "int24"],
          data
        )[0],
        amount1: web3.eth.abi.decodeParameters(
          ["int256", "int256", "uint160", "uint128", "int24"],
          data
        )[1],
        sqrtPriceX96: web3.eth.abi.decodeParameters(
          ["int256", "int256", "uint160", "uint128", "int24"],
          data
        )[2],
        liquidity: web3.eth.abi.decodeParameters(
          ["int256", "int256", "uint160", "uint128", "int24"],
          data
        )[3],
        tick: web3.eth.abi.decodeParameters(
          ["int256", "int256", "uint160", "uint128", "int24"],
          data
        )[4],
      };
    },
  },
  {
    hexSignature:
      "0x834a47bfbb51ad808d8649527d9bf540f58cc71dc1093ae2249c8b230575ce98",
    textSignature:
      "RoyaltyReceiverUpdated (index_topic_1 uint256 niftyType, address previousReceiver, address newReceiver)",
    functionName: "RoyaltyReceiverUpdated",
    type: "ERC20",
    indexLength: 1,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Swap",
        type: "ERC20",
        niftyType: web3.eth.abi.decodeParameter("uint256", topics[1]),
        previousReceiver: web3.eth.abi.decodeParameters(
          ["address", "address"],
          data
        )[0],
        newReceiver: web3.eth.abi.decodeParameters(
          ["address", "address"],
          data
        )[1],
      };
    },
  },
  {
    hexSignature:
      "0x0f6672f78a59ba8e5e5b5d38df3ebc67f3c792e2c9259b8d97d7f00dd78ba1b3",
    textSignature:
      "TransformedERC20 (index_topic_1 address taker, address inputToken, address outputToken, uint256 inputTokenAmount, uint256 outputTokenAmount)",
    functionName: "TransformedERC20",
    type: "ERC20",
    indexLength: 1,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "TransformedERC20",
        type: "ERC20",
        taker: web3.eth.abi.decodeParameter("uint256", topics[1]),
        inputToken: web3.eth.abi.decodeParameters(
          ["address", "address", "uint256", "uint256"],
          data
        )[0],
        outputToken: web3.eth.abi.decodeParameters(
          ["address", "address", "uint256", "uint256"],
          data
        )[1],
        inputTokenAmount: web3.eth.abi.decodeParameters(
          ["address", "address", "uint256", "uint256"],
          data
        )[2],
        outputTokenAmount: web3.eth.abi.decodeParameters(
          ["address", "address", "uint256", "uint256"],
          data
        )[3],
      };
    },
  },
  {
    hexSignature:
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    textSignature:
      "Approval (index_topic_1 address owner, index_topic_2 address approved, index_topic_3 uint256 tokenId)",
    functionName: "Approval",
    type: "ERC721",
    indexLength: 3,
    function: ({
      topics,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Approval",
        type: "ERC721",
        owner: web3.eth.abi.decodeParameter("address", topics[1]),
        approved: web3.eth.abi.decodeParameter("address", topics[2]),
        tokenId: web3.eth.abi.decodeParameter("uint256", topics[3]),
      };
    },
  },
  {
    hexSignature:
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    textSignature:
      "Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)",
    functionName: "Transfer",
    type: "ERC721",
    indexLength: 3,
    function: ({
      address,
      topics,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Transfer",
        type: "ERC721",
        from: web3.eth.abi.decodeParameter("address", topics[1]),
        to: web3.eth.abi.decodeParameter("address", topics[2]),
        contractAddress: address,
        tokenId: web3.eth.abi.decodeParameter("uint256", topics[3]),
      };
    },
  },
  {
    hexSignature:
      "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f",
    textSignature:
      "Mint (index_topic_1 address sender, uint256 amount0, uint256 amount1)",
    functionName: "Mint",
    type: "ERC20",
    indexLength: 1,
    function: ({
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "Mint",
        type: "ERC20",
        sender: web3.eth.abi.decodeParameter("address", topics[1]),
        amount0: web3.eth.abi.decodeParameters(["uint256", "uint256"], data)[0],
        amount1: web3.eth.abi.decodeParameters(["uint256", "uint256"], data)[1],
      };
    },
  },
  {
    hexSignature:
      "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f",
    textSignature:
      "Mint (address minterAddress, uint256 stage, uint256 mintCount)",
    functionName: "Mint",
    type: "ERC721",
    indexLength: 0,
    function: ({
      address,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      const decodedData = web3.eth.abi.decodeParameters(
        ["address", "uint256", "uint256"],
        data
      );
      return {
        name: "Mint",
        type: "ERC721",
        contractAddress: address,
        minterAddress: decodedData[0],
        stage: decodedData[1],
        mintCount: decodedData[2],
      };
    },
  },
  {
    hexSignature:
      "0x17bbfb9a6069321b6ded73bd96327c9e6b7212a5cd51ff219cd61370acafb561",
    textSignature:
      "SwapAndLiquify (uint256 tokensSwapped, uint256 ethReceived, uint256 tokensIntoLiquidity)",
    functionName: "SwapAndLiquify",
    type: "ERC20",
    indexLength: 0,
    function: ({
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      return {
        name: "SwapAndLiquify",
        type: "",
        tokensSwapped: web3.eth.abi.decodeParameters(
          ["uint256", "uint256", "uint256"],
          data
        )[0],
        ethReceived: web3.eth.abi.decodeParameters(
          ["uint256", "uint256"],
          data
        )[1],
        tokensIntoLiquidity: web3.eth.abi.decodeParameters(
          ["uint256", "uint256"],
          data
        )[2],
      };
    },
  },
  {
    hexSignature:
      "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31",
    textSignature:
      "OrderFulfilled (bytes32 orderHash, index_topic_1 address offerer, index_topic_2 address zone, address recipient, tuple[] offer, tuple[] consideration)",
    functionName: "OrderFulfilled",
    type: "ERC721",
    indexLength: 0,
    function: ({
      address,
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      const result: any = web3.eth.abi.decodeParameters(
        [
          "bytes32",
          "address",
          {
            type: "tuple[]",
            components: [
              { type: "uint8" },
              { type: "address" },
              { type: "uint256" },
              { type: "uint256" },
            ],
          },
          {
            type: "tuple[]",
            components: [
              { type: "uint8" },
              { type: "address" },
              { type: "uint256" },
              { type: "uint256" },
              { type: "address" },
            ],
          },
        ],
        data
      );

      return {
        name: "OrderFulfilled",
        type: "ERC721",
        offerer: web3.eth.abi.decodeParameter("address", topics[1]),
        zone: web3.eth.abi.decodeParameter("address", topics[2]),
        orderHash: result[0],
        recipient: result[1],
        offer: result[2],
        consideration: result[3],
        value: result[3].reduce((acc: any, cur: any) => {
          if (cur[3] === "1" || cur[3] === "0") return acc;
          return acc + Number(cur[3]);
        }, 0),
      };
    },
  },
  {
    hexSignature:
      "0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64",
    textSignature:
      "OrdersMatched(index_topic_1 address from, index_topic_2 address to,(address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes),bytes32,(address,uint8,address,address,uint256,uint256,address,uint256,uint256,uint256,(uint16,address)[],uint256,bytes),bytes32)",
    functionName: "OrdersMatched",
    type: "ERC721",
    indexLength: 0,
    function: ({
      address,
      topics,
      data,
    }: {
      address: string;
      topics: string[];
      data: string;
    }) => {
      const hexString: any = data.slice(2).match(/.{1,64}/g);

      const decodedData = hexString.map((chunk: any, index: number) => {
        const isAddress = checkIsAddress(chunk);
        const data = web3.eth.abi.decodeParameter(
          isAddress ? "address" : "uint256",
          chunk
        );

        return data;
      });

      const value = Number(decodedData?.[11]) / 10 ** 18;
      const tokenId = decodedData?.[8];

      return {
        name: "OrdersMatched",
        type: "ERC721",
        from: web3.eth.abi.decodeParameter("address", topics[1]),
        to: web3.eth.abi.decodeParameter("address", topics[2]),
        tokenId,
        value,
      };
    },
  },
];

const test = [
  {
    inputs: [
      { internalType: "address", name: "conduitController", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "BadContractSignature", type: "error" },
  { inputs: [], name: "BadFraction", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "BadReturnValueFromERC20OnTransfer",
    type: "error",
  },
  {
    inputs: [{ internalType: "uint8", name: "v", type: "uint8" }],
    name: "BadSignatureV",
    type: "error",
  },
  { inputs: [], name: "CannotCancelOrder", type: "error" },
  {
    inputs: [],
    name: "ConsiderationCriteriaResolverOutOfRange",
    type: "error",
  },
  {
    inputs: [],
    name: "ConsiderationLengthNotEqualToTotalOriginal",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderIndex", type: "uint256" },
      { internalType: "uint256", name: "considerationIndex", type: "uint256" },
      { internalType: "uint256", name: "shortfallAmount", type: "uint256" },
    ],
    name: "ConsiderationNotMet",
    type: "error",
  },
  { inputs: [], name: "CriteriaNotEnabledForItem", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256[]", name: "identifiers", type: "uint256[]" },
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    name: "ERC1155BatchTransferGenericFailure",
    type: "error",
  },
  { inputs: [], name: "InexactFraction", type: "error" },
  { inputs: [], name: "InsufficientNativeTokensSupplied", type: "error" },
  { inputs: [], name: "Invalid1155BatchTransferEncoding", type: "error" },
  { inputs: [], name: "InvalidBasicOrderParameterEncoding", type: "error" },
  {
    inputs: [{ internalType: "address", name: "conduit", type: "address" }],
    name: "InvalidCallToConduit",
    type: "error",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
      { internalType: "address", name: "conduit", type: "address" },
    ],
    name: "InvalidConduit",
    type: "error",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "InvalidContractOrder",
    type: "error",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "InvalidERC721TransferAmount",
    type: "error",
  },
  { inputs: [], name: "InvalidFulfillmentComponentData", type: "error" },
  {
    inputs: [{ internalType: "uint256", name: "value", type: "uint256" }],
    name: "InvalidMsgValue",
    type: "error",
  },
  { inputs: [], name: "InvalidNativeOfferItem", type: "error" },
  { inputs: [], name: "InvalidProof", type: "error" },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "InvalidRestrictedOrder",
    type: "error",
  },
  { inputs: [], name: "InvalidSignature", type: "error" },
  { inputs: [], name: "InvalidSigner", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
    ],
    name: "InvalidTime",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "fulfillmentIndex", type: "uint256" },
    ],
    name: "MismatchedFulfillmentOfferAndConsiderationComponents",
    type: "error",
  },
  {
    inputs: [{ internalType: "enum Side", name: "side", type: "uint8" }],
    name: "MissingFulfillmentComponentOnAggregation",
    type: "error",
  },
  { inputs: [], name: "MissingItemAmount", type: "error" },
  { inputs: [], name: "MissingOriginalConsiderationItems", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "NativeTokenTransferGenericFailure",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "NoContract",
    type: "error",
  },
  { inputs: [], name: "NoReentrantCalls", type: "error" },
  { inputs: [], name: "NoSpecifiedOrdersAvailable", type: "error" },
  {
    inputs: [],
    name: "OfferAndConsiderationRequiredOnFulfillment",
    type: "error",
  },
  { inputs: [], name: "OfferCriteriaResolverOutOfRange", type: "error" },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "OrderAlreadyFilled",
    type: "error",
  },
  {
    inputs: [{ internalType: "enum Side", name: "side", type: "uint8" }],
    name: "OrderCriteriaResolverOutOfRange",
    type: "error",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "OrderIsCancelled",
    type: "error",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "OrderPartiallyFilled",
    type: "error",
  },
  { inputs: [], name: "PartialFillsNotEnabledForOrder", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "identifier", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "TokenTransferGenericFailure",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderIndex", type: "uint256" },
      { internalType: "uint256", name: "considerationIndex", type: "uint256" },
    ],
    name: "UnresolvedConsiderationCriteria",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderIndex", type: "uint256" },
      { internalType: "uint256", name: "offerIndex", type: "uint256" },
    ],
    name: "UnresolvedOfferCriteria",
    type: "error",
  },
  { inputs: [], name: "UnusedItemParameters", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newCounter",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "offerer",
        type: "address",
      },
    ],
    name: "CounterIncremented",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "orderHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "offerer",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "zone", type: "address" },
    ],
    name: "OrderCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "orderHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "offerer",
        type: "address",
      },
      { indexed: true, internalType: "address", name: "zone", type: "address" },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        components: [
          { internalType: "enum ItemType", name: "itemType", type: "uint8" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "identifier", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        indexed: false,
        internalType: "struct SpentItem[]",
        name: "offer",
        type: "tuple[]",
      },
      {
        components: [
          { internalType: "enum ItemType", name: "itemType", type: "uint8" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "identifier", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          {
            internalType: "address payable",
            name: "recipient",
            type: "address",
          },
        ],
        indexed: false,
        internalType: "struct ReceivedItem[]",
        name: "consideration",
        type: "tuple[]",
      },
    ],
    name: "OrderFulfilled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "orderHash",
        type: "bytes32",
      },
      {
        components: [
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "address", name: "zone", type: "address" },
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              {
                internalType: "uint256",
                name: "identifierOrCriteria",
                type: "uint256",
              },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
            ],
            internalType: "struct OfferItem[]",
            name: "offer",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              {
                internalType: "uint256",
                name: "identifierOrCriteria",
                type: "uint256",
              },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ConsiderationItem[]",
            name: "consideration",
            type: "tuple[]",
          },
          { internalType: "enum OrderType", name: "orderType", type: "uint8" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
          {
            internalType: "uint256",
            name: "totalOriginalConsiderationItems",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct OrderParameters",
        name: "orderParameters",
        type: "tuple",
      },
    ],
    name: "OrderValidated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "orderHashes",
        type: "bytes32[]",
      },
    ],
    name: "OrdersMatched",
    type: "event",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "address", name: "zone", type: "address" },
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              {
                internalType: "uint256",
                name: "identifierOrCriteria",
                type: "uint256",
              },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
            ],
            internalType: "struct OfferItem[]",
            name: "offer",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              {
                internalType: "uint256",
                name: "identifierOrCriteria",
                type: "uint256",
              },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ConsiderationItem[]",
            name: "consideration",
            type: "tuple[]",
          },
          { internalType: "enum OrderType", name: "orderType", type: "uint8" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
          { internalType: "uint256", name: "counter", type: "uint256" },
        ],
        internalType: "struct OrderComponents[]",
        name: "orders",
        type: "tuple[]",
      },
    ],
    name: "cancel",
    outputs: [{ internalType: "bool", name: "cancelled", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "uint120", name: "numerator", type: "uint120" },
          { internalType: "uint120", name: "denominator", type: "uint120" },
          { internalType: "bytes", name: "signature", type: "bytes" },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct AdvancedOrder",
        name: "",
        type: "tuple",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "uint256", name: "index", type: "uint256" },
          { internalType: "uint256", name: "identifier", type: "uint256" },
          {
            internalType: "bytes32[]",
            name: "criteriaProof",
            type: "bytes32[]",
          },
        ],
        internalType: "struct CriteriaResolver[]",
        name: "",
        type: "tuple[]",
      },
      { internalType: "bytes32", name: "fulfillerConduitKey", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "fulfillAdvancedOrder",
    outputs: [{ internalType: "bool", name: "fulfilled", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "uint120", name: "numerator", type: "uint120" },
          { internalType: "uint120", name: "denominator", type: "uint120" },
          { internalType: "bytes", name: "signature", type: "bytes" },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct AdvancedOrder[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "uint256", name: "index", type: "uint256" },
          { internalType: "uint256", name: "identifier", type: "uint256" },
          {
            internalType: "bytes32[]",
            name: "criteriaProof",
            type: "bytes32[]",
          },
        ],
        internalType: "struct CriteriaResolver[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "uint256", name: "itemIndex", type: "uint256" },
        ],
        internalType: "struct FulfillmentComponent[][]",
        name: "",
        type: "tuple[][]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "uint256", name: "itemIndex", type: "uint256" },
        ],
        internalType: "struct FulfillmentComponent[][]",
        name: "",
        type: "tuple[][]",
      },
      { internalType: "bytes32", name: "fulfillerConduitKey", type: "bytes32" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "maximumFulfilled", type: "uint256" },
    ],
    name: "fulfillAvailableAdvancedOrders",
    outputs: [
      { internalType: "bool[]", name: "", type: "bool[]" },
      {
        components: [
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              { internalType: "uint256", name: "identifier", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ReceivedItem",
            name: "item",
            type: "tuple",
          },
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
        ],
        internalType: "struct Execution[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct Order[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "uint256", name: "itemIndex", type: "uint256" },
        ],
        internalType: "struct FulfillmentComponent[][]",
        name: "",
        type: "tuple[][]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "uint256", name: "itemIndex", type: "uint256" },
        ],
        internalType: "struct FulfillmentComponent[][]",
        name: "",
        type: "tuple[][]",
      },
      { internalType: "bytes32", name: "fulfillerConduitKey", type: "bytes32" },
      { internalType: "uint256", name: "maximumFulfilled", type: "uint256" },
    ],
    name: "fulfillAvailableOrders",
    outputs: [
      { internalType: "bool[]", name: "", type: "bool[]" },
      {
        components: [
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              { internalType: "uint256", name: "identifier", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ReceivedItem",
            name: "item",
            type: "tuple",
          },
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
        ],
        internalType: "struct Execution[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "considerationToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "considerationIdentifier",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "considerationAmount",
            type: "uint256",
          },
          { internalType: "address payable", name: "offerer", type: "address" },
          { internalType: "address", name: "zone", type: "address" },
          { internalType: "address", name: "offerToken", type: "address" },
          { internalType: "uint256", name: "offerIdentifier", type: "uint256" },
          { internalType: "uint256", name: "offerAmount", type: "uint256" },
          {
            internalType: "enum BasicOrderType",
            name: "basicOrderType",
            type: "uint8",
          },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
          { internalType: "uint256", name: "salt", type: "uint256" },
          {
            internalType: "bytes32",
            name: "offererConduitKey",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "fulfillerConduitKey",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "totalOriginalAdditionalRecipients",
            type: "uint256",
          },
          {
            components: [
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct AdditionalRecipient[]",
            name: "additionalRecipients",
            type: "tuple[]",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct BasicOrderParameters",
        name: "parameters",
        type: "tuple",
      },
    ],
    name: "fulfillBasicOrder",
    outputs: [{ internalType: "bool", name: "fulfilled", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "considerationToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "considerationIdentifier",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "considerationAmount",
            type: "uint256",
          },
          { internalType: "address payable", name: "offerer", type: "address" },
          { internalType: "address", name: "zone", type: "address" },
          { internalType: "address", name: "offerToken", type: "address" },
          { internalType: "uint256", name: "offerIdentifier", type: "uint256" },
          { internalType: "uint256", name: "offerAmount", type: "uint256" },
          {
            internalType: "enum BasicOrderType",
            name: "basicOrderType",
            type: "uint8",
          },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
          { internalType: "uint256", name: "salt", type: "uint256" },
          {
            internalType: "bytes32",
            name: "offererConduitKey",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "fulfillerConduitKey",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "totalOriginalAdditionalRecipients",
            type: "uint256",
          },
          {
            components: [
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct AdditionalRecipient[]",
            name: "additionalRecipients",
            type: "tuple[]",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct BasicOrderParameters",
        name: "parameters",
        type: "tuple",
      },
    ],
    name: "fulfillBasicOrder_efficient_6GL6yc",
    outputs: [{ internalType: "bool", name: "fulfilled", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct Order",
        name: "",
        type: "tuple",
      },
      { internalType: "bytes32", name: "fulfillerConduitKey", type: "bytes32" },
    ],
    name: "fulfillOrder",
    outputs: [{ internalType: "bool", name: "fulfilled", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "contractOfferer", type: "address" },
    ],
    name: "getContractOffererNonce",
    outputs: [{ internalType: "uint256", name: "nonce", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "offerer", type: "address" }],
    name: "getCounter",
    outputs: [{ internalType: "uint256", name: "counter", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "address", name: "zone", type: "address" },
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              {
                internalType: "uint256",
                name: "identifierOrCriteria",
                type: "uint256",
              },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
            ],
            internalType: "struct OfferItem[]",
            name: "offer",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              {
                internalType: "uint256",
                name: "identifierOrCriteria",
                type: "uint256",
              },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ConsiderationItem[]",
            name: "consideration",
            type: "tuple[]",
          },
          { internalType: "enum OrderType", name: "orderType", type: "uint8" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
          { internalType: "uint256", name: "counter", type: "uint256" },
        ],
        internalType: "struct OrderComponents",
        name: "",
        type: "tuple",
      },
    ],
    name: "getOrderHash",
    outputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderHash", type: "bytes32" }],
    name: "getOrderStatus",
    outputs: [
      { internalType: "bool", name: "isValidated", type: "bool" },
      { internalType: "bool", name: "isCancelled", type: "bool" },
      { internalType: "uint256", name: "totalFilled", type: "uint256" },
      { internalType: "uint256", name: "totalSize", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "incrementCounter",
    outputs: [{ internalType: "uint256", name: "newCounter", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "information",
    outputs: [
      { internalType: "string", name: "version", type: "string" },
      { internalType: "bytes32", name: "domainSeparator", type: "bytes32" },
      { internalType: "address", name: "conduitController", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "uint120", name: "numerator", type: "uint120" },
          { internalType: "uint120", name: "denominator", type: "uint120" },
          { internalType: "bytes", name: "signature", type: "bytes" },
          { internalType: "bytes", name: "extraData", type: "bytes" },
        ],
        internalType: "struct AdvancedOrder[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          { internalType: "uint256", name: "orderIndex", type: "uint256" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "uint256", name: "index", type: "uint256" },
          { internalType: "uint256", name: "identifier", type: "uint256" },
          {
            internalType: "bytes32[]",
            name: "criteriaProof",
            type: "bytes32[]",
          },
        ],
        internalType: "struct CriteriaResolver[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          {
            components: [
              { internalType: "uint256", name: "orderIndex", type: "uint256" },
              { internalType: "uint256", name: "itemIndex", type: "uint256" },
            ],
            internalType: "struct FulfillmentComponent[]",
            name: "offerComponents",
            type: "tuple[]",
          },
          {
            components: [
              { internalType: "uint256", name: "orderIndex", type: "uint256" },
              { internalType: "uint256", name: "itemIndex", type: "uint256" },
            ],
            internalType: "struct FulfillmentComponent[]",
            name: "considerationComponents",
            type: "tuple[]",
          },
        ],
        internalType: "struct Fulfillment[]",
        name: "",
        type: "tuple[]",
      },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "matchAdvancedOrders",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              { internalType: "uint256", name: "identifier", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ReceivedItem",
            name: "item",
            type: "tuple",
          },
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
        ],
        internalType: "struct Execution[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct Order[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          {
            components: [
              { internalType: "uint256", name: "orderIndex", type: "uint256" },
              { internalType: "uint256", name: "itemIndex", type: "uint256" },
            ],
            internalType: "struct FulfillmentComponent[]",
            name: "offerComponents",
            type: "tuple[]",
          },
          {
            components: [
              { internalType: "uint256", name: "orderIndex", type: "uint256" },
              { internalType: "uint256", name: "itemIndex", type: "uint256" },
            ],
            internalType: "struct FulfillmentComponent[]",
            name: "considerationComponents",
            type: "tuple[]",
          },
        ],
        internalType: "struct Fulfillment[]",
        name: "",
        type: "tuple[]",
      },
    ],
    name: "matchOrders",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "enum ItemType",
                name: "itemType",
                type: "uint8",
              },
              { internalType: "address", name: "token", type: "address" },
              { internalType: "uint256", name: "identifier", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct ReceivedItem",
            name: "item",
            type: "tuple",
          },
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
        ],
        internalType: "struct Execution[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                ],
                internalType: "struct OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  {
                    internalType: "enum ItemType",
                    name: "itemType",
                    type: "uint8",
                  },
                  { internalType: "address", name: "token", type: "address" },
                  {
                    internalType: "uint256",
                    name: "identifierOrCriteria",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "startAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "endAmount",
                    type: "uint256",
                  },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              {
                internalType: "enum OrderType",
                name: "orderType",
                type: "uint8",
              },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              {
                internalType: "uint256",
                name: "totalOriginalConsiderationItems",
                type: "uint256",
              },
            ],
            internalType: "struct OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct Order[]",
        name: "",
        type: "tuple[]",
      },
    ],
    name: "validate",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

export const ERC_20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_from",
        type: "address",
      },
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_to",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
      {
        name: "_spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    payable: true,
    stateMutability: "payable",
    type: "fallback",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

export const ERC_721_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
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
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const ERC_1155_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
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
        indexed: false,
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "values",
        type: "uint256[]",
      },
    ],
    name: "TransferBatch",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
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
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "TransferSingle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "value",
        type: "string",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "URI",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    name: "balanceOfBatch",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeBatchTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "uri",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
