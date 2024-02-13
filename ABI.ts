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
        const isERC721 = offer?.itemType == SEAPORT_ITEM_TYPE["ERC721"];
        const isERC20 = offer?.itemType == SEAPORT_ITEM_TYPE["ERC20"];
        const isERC1155 = offer?.itemType == SEAPORT_ITEM_TYPE["ERC1155"];

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

          const target = orderFulfilledEvent?.consideration.find((item) => {
            return item?.itemType == SEAPORT_ITEM_TYPE["ERC721"];
          });

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
      transactionHash,
    }: {
      address: string;
      topics: string[];
      data: string;
      log?: any;
      logs: Log[];
      blockNumber: number;
      transactionHash?: string;
    }): Promise<SaleInterface | undefined> => {
      try {
        const BLUR_ABI = {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "address",
              name: "maker",
              type: "address",
            },
            {
              indexed: true,
              internalType: "address",
              name: "taker",
              type: "address",
            },
            {
              components: [
                { internalType: "address", name: "trader", type: "address" },
                { internalType: "enum Side", name: "side", type: "uint8" },
                {
                  internalType: "address",
                  name: "matchingPolicy",
                  type: "address",
                },
                {
                  internalType: "address",
                  name: "collection",
                  type: "address",
                },
                { internalType: "uint256", name: "tokenId", type: "uint256" },
                { internalType: "uint256", name: "amount", type: "uint256" },
                {
                  internalType: "address",
                  name: "paymentToken",
                  type: "address",
                },
                { internalType: "uint256", name: "price", type: "uint256" },
                {
                  internalType: "uint256",
                  name: "listingTime",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "expirationTime",
                  type: "uint256",
                },
                {
                  components: [
                    { internalType: "uint16", name: "rate", type: "uint16" },
                    {
                      internalType: "address payable",
                      name: "recipient",
                      type: "address",
                    },
                  ],
                  internalType: "struct Fee[]",
                  name: "fees",
                  type: "tuple[]",
                },
                { internalType: "uint256", name: "salt", type: "uint256" },
                { internalType: "bytes", name: "extraParams", type: "bytes" },
              ],
              indexed: false,
              internalType: "struct Order",
              name: "sell",
              type: "tuple",
            },
            {
              indexed: false,
              internalType: "bytes32",
              name: "sellHash",
              type: "bytes32",
            },
            {
              components: [
                { internalType: "address", name: "trader", type: "address" },
                { internalType: "enum Side", name: "side", type: "uint8" },
                {
                  internalType: "address",
                  name: "matchingPolicy",
                  type: "address",
                },
                {
                  internalType: "address",
                  name: "collection",
                  type: "address",
                },
                { internalType: "uint256", name: "tokenId", type: "uint256" },
                { internalType: "uint256", name: "amount", type: "uint256" },
                {
                  internalType: "address",
                  name: "paymentToken",
                  type: "address",
                },
                { internalType: "uint256", name: "price", type: "uint256" },
                {
                  internalType: "uint256",
                  name: "listingTime",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "expirationTime",
                  type: "uint256",
                },
                {
                  components: [
                    { internalType: "uint16", name: "rate", type: "uint16" },
                    {
                      internalType: "address payable",
                      name: "recipient",
                      type: "address",
                    },
                  ],
                  internalType: "struct Fee[]",
                  name: "fees",
                  type: "tuple[]",
                },
                { internalType: "uint256", name: "salt", type: "uint256" },
                { internalType: "bytes", name: "extraParams", type: "bytes" },
              ],
              indexed: false,
              internalType: "struct Order",
              name: "buy",
              type: "tuple",
            },
            {
              indexed: false,
              internalType: "bytes32",
              name: "buyHash",
              type: "bytes32",
            },
          ],
          name: "OrdersMatched",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          BLUR_ABI.inputs.filter((input) => !input.indexed),
          data
        );

        const contract = decodedData.sell.collection; // 컬렉션 주소
        const value = Number(decodedData.sell.price) / 10 ** 18;
        const tokenId = decodedData.sell.tokenId; // 토큰 ID
        const from = decodedData.sell.trader; // 판매자 (maker)
        const to = decodedData.buy.trader; // 구매자 (taker)
        const quantity = decodedData.sell.amount; // 수량

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
      "0x7ffb5bd9cdc79a6f9bc6e00c82f43836e0afbb204d47972001f6e853764a8ef1",
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
    }): Promise<any> => {
      try {
        const BLUR_ABI = {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "lienId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "address",
              name: "collection",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "buyer",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "seller",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
          ],
          name: "BuyLocked",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          BLUR_ABI.inputs,
          data
        );

        const totalAmount = logs.reduce((accumulator, item) => {
          const hexSignature = item.topics?.[0];
          if (item.topics.length !== 3) return accumulator;
          if (
            hexSignature ===
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
          ) {
            const amount = web3.eth.abi.decodeParameter("uint256", item?.data);
            const fromAddress: any = web3.eth.abi.decodeParameter(
              "address",
              item?.topics[1]
            );

            if (
              fromAddress.toLowerCase() ===
              "0x0000000000000000000000000000000000000000"
            ) {
              return accumulator;
            }

            return accumulator + Number(amount);
          }
          return accumulator;
        }, 0);

        const value = Number(totalAmount) / 10 ** 18;

        return {
          action: "Sale",
          contract: decodedData?.collection,
          tokenId: String(decodedData?.tokenId),
          from: decodedData?.seller,
          to: decodedData?.buyer,
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
          `시그니처 - 0x7ffb5bd9cdc79a6f9bc6e00c82f43836e0afbb204d47972001f6e853764a8ef1`,
          `blockNumber - ${blockNumber}`
        );
        await getRepository(DecodeError).save({
          blockNumber,
          signature:
            "0x7ffb5bd9cdc79a6f9bc6e00c82f43836e0afbb204d47972001f6e853764a8ef1",
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
      address,
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
        const X2Y2_ABI = {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "bytes32",
              name: "itemHash",
              type: "bytes32",
            },
            {
              indexed: false,
              internalType: "address",
              name: "maker",
              type: "address",
            },
            {
              indexed: false,
              internalType: "address",
              name: "taker",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "orderSalt",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "settleSalt",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "intent",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "delegateType",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "deadline",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "contract IERC20Upgradeable",
              name: "currency",
              type: "address",
            },
            {
              indexed: false,
              internalType: "bytes",
              name: "dataMask",
              type: "bytes",
            },
            {
              components: [
                { internalType: "uint256", name: "price", type: "uint256" },
                { internalType: "bytes", name: "data", type: "bytes" },
              ],
              indexed: false,
              internalType: "struct Market.OrderItem",
              name: "item",
              type: "tuple",
            },
            {
              components: [
                { internalType: "enum Market.Op", name: "op", type: "uint8" },
                { internalType: "uint256", name: "orderIdx", type: "uint256" },
                { internalType: "uint256", name: "itemIdx", type: "uint256" },
                { internalType: "uint256", name: "price", type: "uint256" },
                { internalType: "bytes32", name: "itemHash", type: "bytes32" },
                {
                  internalType: "contract IDelegate",
                  name: "executionDelegate",
                  type: "address",
                },
                {
                  internalType: "bytes",
                  name: "dataReplacement",
                  type: "bytes",
                },
                {
                  internalType: "uint256",
                  name: "bidIncentivePct",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "aucMinIncrementPct",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "aucIncDurationSecs",
                  type: "uint256",
                },
                {
                  components: [
                    {
                      internalType: "uint256",
                      name: "percentage",
                      type: "uint256",
                    },
                    { internalType: "address", name: "to", type: "address" },
                  ],
                  internalType: "struct Market.Fee[]",
                  name: "fees",
                  type: "tuple[]",
                },
              ],
              indexed: false,
              internalType: "struct Market.SettleDetail",
              name: "detail",
              type: "tuple",
            },
          ],
          name: "EvInventory",
          type: "event",
        };

        const decodedData: any = web3.eth.abi.decodeParameters(
          X2Y2_ABI.inputs.filter((input) => !input.indexed),
          data
        );

        const hexString: any = data.slice(2).match(/.{1,64}/g);
        const splitedDecodedData = hexString.map(
          (chunk: any, index: number) => {
            const type = X2Y2_TYPE[index];
            if (!type) {
              return chunk;
            }
            if (type === "hex") {
              return chunk;
            }
            try {
              const data = web3.eth.abi.decodeParameter(type, chunk);
              return data;
            } catch (e) {}
          }
        );

        const contract = splitedDecodedData?.[17];
        const quantity = Number(splitedDecodedData?.[16]);
        const tokenId = splitedDecodedData?.[18];
        const value = Number(decodedData.detail.price) / 10 ** 18;
        const from = decodedData.maker;
        const to = decodedData.taker;

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

        const fromAddress: any = web3.eth.abi.decodeParameter(
          "address",
          topics[1]
        );
        const actionType =
          fromAddress.toLowerCase() ===
          "0x0000000000000000000000000000000000000000"
            ? "Mint"
            : "Transfer";

        return {
          action: actionType,
          contract: address,
          quantity: "1",
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

        const fromAddress: any = web3.eth.abi.decodeParameter(
          "address",
          topics[2]
        );
        const actionType =
          fromAddress.toLowerCase() ===
          "0x0000000000000000000000000000000000000000"
            ? "Mint"
            : "Transfer";

        return {
          action: actionType,
          contract: address,
          tokenId,
          quantity: String(quantity),
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

const test = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  { anonymous: false, inputs: [], name: "Closed", type: "event" },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint8", name: "version", type: "uint8" },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "blockRange",
        type: "uint256",
      },
    ],
    name: "NewBlockRange",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IExecutionDelegate",
        name: "executionDelegate",
        type: "address",
      },
    ],
    name: "NewExecutionDelegate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "feeRate",
        type: "uint256",
      },
    ],
    name: "NewFeeRate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    name: "NewFeeRecipient",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "governor",
        type: "address",
      },
    ],
    name: "NewGovernor",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oracle",
        type: "address",
      },
    ],
    name: "NewOracle",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "contract IPolicyManager",
        name: "policyManager",
        type: "address",
      },
    ],
    name: "NewPolicyManager",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "trader",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newNonce",
        type: "uint256",
      },
    ],
    name: "NonceIncremented",
    type: "event",
  },
  { anonymous: false, inputs: [], name: "Opened", type: "event" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32",
        name: "hash",
        type: "bytes32",
      },
    ],
    name: "OrderCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "taker",
        type: "address",
      },
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "address", name: "matchingPolicy", type: "address" },
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "listingTime", type: "uint256" },
          { internalType: "uint256", name: "expirationTime", type: "uint256" },
          {
            components: [
              { internalType: "uint16", name: "rate", type: "uint16" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct Fee[]",
            name: "fees",
            type: "tuple[]",
          },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes", name: "extraParams", type: "bytes" },
        ],
        indexed: false,
        internalType: "struct Order",
        name: "sell",
        type: "tuple",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "sellHash",
        type: "bytes32",
      },
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "address", name: "matchingPolicy", type: "address" },
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "listingTime", type: "uint256" },
          { internalType: "uint256", name: "expirationTime", type: "uint256" },
          {
            components: [
              { internalType: "uint16", name: "rate", type: "uint16" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct Fee[]",
            name: "fees",
            type: "tuple[]",
          },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes", name: "extraParams", type: "bytes" },
        ],
        indexed: false,
        internalType: "struct Order",
        name: "buy",
        type: "tuple",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "buyHash",
        type: "bytes32",
      },
    ],
    name: "OrdersMatched",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [],
    name: "FEE_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "INVERSE_BASIS_POINT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "NAME",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ORACLE_ORDER_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ORDER_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "POOL",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ROOT_TYPEHASH",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "VERSION",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "trader", type: "address" },
              { internalType: "enum Side", name: "side", type: "uint8" },
              {
                internalType: "address",
                name: "matchingPolicy",
                type: "address",
              },
              { internalType: "address", name: "collection", type: "address" },
              { internalType: "uint256", name: "tokenId", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address",
                name: "paymentToken",
                type: "address",
              },
              { internalType: "uint256", name: "price", type: "uint256" },
              { internalType: "uint256", name: "listingTime", type: "uint256" },
              {
                internalType: "uint256",
                name: "expirationTime",
                type: "uint256",
              },
              {
                components: [
                  { internalType: "uint16", name: "rate", type: "uint16" },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct Fee[]",
                name: "fees",
                type: "tuple[]",
              },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes", name: "extraParams", type: "bytes" },
            ],
            internalType: "struct Order",
            name: "order",
            type: "tuple",
          },
          { internalType: "uint8", name: "v", type: "uint8" },
          { internalType: "bytes32", name: "r", type: "bytes32" },
          { internalType: "bytes32", name: "s", type: "bytes32" },
          { internalType: "bytes", name: "extraSignature", type: "bytes" },
          {
            internalType: "enum SignatureVersion",
            name: "signatureVersion",
            type: "uint8",
          },
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
        ],
        internalType: "struct Input",
        name: "sell",
        type: "tuple",
      },
      {
        components: [
          {
            components: [
              { internalType: "address", name: "trader", type: "address" },
              { internalType: "enum Side", name: "side", type: "uint8" },
              {
                internalType: "address",
                name: "matchingPolicy",
                type: "address",
              },
              { internalType: "address", name: "collection", type: "address" },
              { internalType: "uint256", name: "tokenId", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address",
                name: "paymentToken",
                type: "address",
              },
              { internalType: "uint256", name: "price", type: "uint256" },
              { internalType: "uint256", name: "listingTime", type: "uint256" },
              {
                internalType: "uint256",
                name: "expirationTime",
                type: "uint256",
              },
              {
                components: [
                  { internalType: "uint16", name: "rate", type: "uint16" },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct Fee[]",
                name: "fees",
                type: "tuple[]",
              },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes", name: "extraParams", type: "bytes" },
            ],
            internalType: "struct Order",
            name: "order",
            type: "tuple",
          },
          { internalType: "uint8", name: "v", type: "uint8" },
          { internalType: "bytes32", name: "r", type: "bytes32" },
          { internalType: "bytes32", name: "s", type: "bytes32" },
          { internalType: "bytes", name: "extraSignature", type: "bytes" },
          {
            internalType: "enum SignatureVersion",
            name: "signatureVersion",
            type: "uint8",
          },
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
        ],
        internalType: "struct Input",
        name: "buy",
        type: "tuple",
      },
    ],
    name: "_execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "blockRange",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "trader", type: "address" },
                  { internalType: "enum Side", name: "side", type: "uint8" },
                  {
                    internalType: "address",
                    name: "matchingPolicy",
                    type: "address",
                  },
                  {
                    internalType: "address",
                    name: "collection",
                    type: "address",
                  },
                  { internalType: "uint256", name: "tokenId", type: "uint256" },
                  { internalType: "uint256", name: "amount", type: "uint256" },
                  {
                    internalType: "address",
                    name: "paymentToken",
                    type: "address",
                  },
                  { internalType: "uint256", name: "price", type: "uint256" },
                  {
                    internalType: "uint256",
                    name: "listingTime",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "expirationTime",
                    type: "uint256",
                  },
                  {
                    components: [
                      { internalType: "uint16", name: "rate", type: "uint16" },
                      {
                        internalType: "address payable",
                        name: "recipient",
                        type: "address",
                      },
                    ],
                    internalType: "struct Fee[]",
                    name: "fees",
                    type: "tuple[]",
                  },
                  { internalType: "uint256", name: "salt", type: "uint256" },
                  { internalType: "bytes", name: "extraParams", type: "bytes" },
                ],
                internalType: "struct Order",
                name: "order",
                type: "tuple",
              },
              { internalType: "uint8", name: "v", type: "uint8" },
              { internalType: "bytes32", name: "r", type: "bytes32" },
              { internalType: "bytes32", name: "s", type: "bytes32" },
              { internalType: "bytes", name: "extraSignature", type: "bytes" },
              {
                internalType: "enum SignatureVersion",
                name: "signatureVersion",
                type: "uint8",
              },
              { internalType: "uint256", name: "blockNumber", type: "uint256" },
            ],
            internalType: "struct Input",
            name: "sell",
            type: "tuple",
          },
          {
            components: [
              {
                components: [
                  { internalType: "address", name: "trader", type: "address" },
                  { internalType: "enum Side", name: "side", type: "uint8" },
                  {
                    internalType: "address",
                    name: "matchingPolicy",
                    type: "address",
                  },
                  {
                    internalType: "address",
                    name: "collection",
                    type: "address",
                  },
                  { internalType: "uint256", name: "tokenId", type: "uint256" },
                  { internalType: "uint256", name: "amount", type: "uint256" },
                  {
                    internalType: "address",
                    name: "paymentToken",
                    type: "address",
                  },
                  { internalType: "uint256", name: "price", type: "uint256" },
                  {
                    internalType: "uint256",
                    name: "listingTime",
                    type: "uint256",
                  },
                  {
                    internalType: "uint256",
                    name: "expirationTime",
                    type: "uint256",
                  },
                  {
                    components: [
                      { internalType: "uint16", name: "rate", type: "uint16" },
                      {
                        internalType: "address payable",
                        name: "recipient",
                        type: "address",
                      },
                    ],
                    internalType: "struct Fee[]",
                    name: "fees",
                    type: "tuple[]",
                  },
                  { internalType: "uint256", name: "salt", type: "uint256" },
                  { internalType: "bytes", name: "extraParams", type: "bytes" },
                ],
                internalType: "struct Order",
                name: "order",
                type: "tuple",
              },
              { internalType: "uint8", name: "v", type: "uint8" },
              { internalType: "bytes32", name: "r", type: "bytes32" },
              { internalType: "bytes32", name: "s", type: "bytes32" },
              { internalType: "bytes", name: "extraSignature", type: "bytes" },
              {
                internalType: "enum SignatureVersion",
                name: "signatureVersion",
                type: "uint8",
              },
              { internalType: "uint256", name: "blockNumber", type: "uint256" },
            ],
            internalType: "struct Input",
            name: "buy",
            type: "tuple",
          },
        ],
        internalType: "struct Execution[]",
        name: "executions",
        type: "tuple[]",
      },
    ],
    name: "bulkExecute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "address", name: "matchingPolicy", type: "address" },
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "listingTime", type: "uint256" },
          { internalType: "uint256", name: "expirationTime", type: "uint256" },
          {
            components: [
              { internalType: "uint16", name: "rate", type: "uint16" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct Fee[]",
            name: "fees",
            type: "tuple[]",
          },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes", name: "extraParams", type: "bytes" },
        ],
        internalType: "struct Order",
        name: "order",
        type: "tuple",
      },
    ],
    name: "cancelOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "enum Side", name: "side", type: "uint8" },
          { internalType: "address", name: "matchingPolicy", type: "address" },
          { internalType: "address", name: "collection", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "address", name: "paymentToken", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "listingTime", type: "uint256" },
          { internalType: "uint256", name: "expirationTime", type: "uint256" },
          {
            components: [
              { internalType: "uint16", name: "rate", type: "uint16" },
              {
                internalType: "address payable",
                name: "recipient",
                type: "address",
              },
            ],
            internalType: "struct Fee[]",
            name: "fees",
            type: "tuple[]",
          },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes", name: "extraParams", type: "bytes" },
        ],
        internalType: "struct Order[]",
        name: "orders",
        type: "tuple[]",
      },
    ],
    name: "cancelOrders",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "cancelledOrFilled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "close",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "trader", type: "address" },
              { internalType: "enum Side", name: "side", type: "uint8" },
              {
                internalType: "address",
                name: "matchingPolicy",
                type: "address",
              },
              { internalType: "address", name: "collection", type: "address" },
              { internalType: "uint256", name: "tokenId", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address",
                name: "paymentToken",
                type: "address",
              },
              { internalType: "uint256", name: "price", type: "uint256" },
              { internalType: "uint256", name: "listingTime", type: "uint256" },
              {
                internalType: "uint256",
                name: "expirationTime",
                type: "uint256",
              },
              {
                components: [
                  { internalType: "uint16", name: "rate", type: "uint16" },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct Fee[]",
                name: "fees",
                type: "tuple[]",
              },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes", name: "extraParams", type: "bytes" },
            ],
            internalType: "struct Order",
            name: "order",
            type: "tuple",
          },
          { internalType: "uint8", name: "v", type: "uint8" },
          { internalType: "bytes32", name: "r", type: "bytes32" },
          { internalType: "bytes32", name: "s", type: "bytes32" },
          { internalType: "bytes", name: "extraSignature", type: "bytes" },
          {
            internalType: "enum SignatureVersion",
            name: "signatureVersion",
            type: "uint8",
          },
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
        ],
        internalType: "struct Input",
        name: "sell",
        type: "tuple",
      },
      {
        components: [
          {
            components: [
              { internalType: "address", name: "trader", type: "address" },
              { internalType: "enum Side", name: "side", type: "uint8" },
              {
                internalType: "address",
                name: "matchingPolicy",
                type: "address",
              },
              { internalType: "address", name: "collection", type: "address" },
              { internalType: "uint256", name: "tokenId", type: "uint256" },
              { internalType: "uint256", name: "amount", type: "uint256" },
              {
                internalType: "address",
                name: "paymentToken",
                type: "address",
              },
              { internalType: "uint256", name: "price", type: "uint256" },
              { internalType: "uint256", name: "listingTime", type: "uint256" },
              {
                internalType: "uint256",
                name: "expirationTime",
                type: "uint256",
              },
              {
                components: [
                  { internalType: "uint16", name: "rate", type: "uint16" },
                  {
                    internalType: "address payable",
                    name: "recipient",
                    type: "address",
                  },
                ],
                internalType: "struct Fee[]",
                name: "fees",
                type: "tuple[]",
              },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes", name: "extraParams", type: "bytes" },
            ],
            internalType: "struct Order",
            name: "order",
            type: "tuple",
          },
          { internalType: "uint8", name: "v", type: "uint8" },
          { internalType: "bytes32", name: "r", type: "bytes32" },
          { internalType: "bytes32", name: "s", type: "bytes32" },
          { internalType: "bytes", name: "extraSignature", type: "bytes" },
          {
            internalType: "enum SignatureVersion",
            name: "signatureVersion",
            type: "uint8",
          },
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
        ],
        internalType: "struct Input",
        name: "buy",
        type: "tuple",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "executionDelegate",
    outputs: [
      {
        internalType: "contract IExecutionDelegate",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "governor",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "incrementNonce",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IExecutionDelegate",
        name: "_executionDelegate",
        type: "address",
      },
      {
        internalType: "contract IPolicyManager",
        name: "_policyManager",
        type: "address",
      },
      { internalType: "address", name: "_oracle", type: "address" },
      { internalType: "uint256", name: "_blockRange", type: "uint256" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isInternal",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isOpen",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "open",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "oracle",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "policyManager",
    outputs: [
      { internalType: "contract IPolicyManager", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "remainingETH",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_blockRange", type: "uint256" }],
    name: "setBlockRange",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IExecutionDelegate",
        name: "_executionDelegate",
        type: "address",
      },
    ],
    name: "setExecutionDelegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_feeRate", type: "uint256" }],
    name: "setFeeRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_feeRecipient", type: "address" },
    ],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_governor", type: "address" }],
    name: "setGovernor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_oracle", type: "address" }],
    name: "setOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IPolicyManager",
        name: "_policyManager",
        type: "address",
      },
    ],
    name: "setPolicyManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
