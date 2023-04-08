import Web3 from "web3";
import { Action } from "./modules/decodeLog";
import {
  OrderFulfilledEvent,
  ReceivedItem,
  SEAPORT_ITEM_TYPE,
} from "./seportTypes";
import { checkIsAddress } from "./utils";

const web3 = new Web3();

interface SaleInterface {
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

interface TransferInterface {
  action: Action;
  from: string;
  to: string;
  tokenId: string;
}

export const SALE_HEX_SIGNATURE_LIST = [
  {
    hexSignature:
      "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31",
    decode: (topics: string[], data: string): SaleInterface | null => {
      const decodedData = web3.eth.abi.decodeParameters(
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
        offerer: web3.eth.abi.decodeParameter("address", topics[1]),
        zone: web3.eth.abi.decodeParameter("address", topics[2]),
        orderHash: decodedData[0],
        recipient: decodedData[1],
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

      if (orderFulfilledEvent?.offer?.length > 1) {
        console.log("orderFulfilledEvent", orderFulfilledEvent);
      }

      const offer = orderFulfilledEvent?.offer[0];
      const isERC721 = offer.itemType === SEAPORT_ITEM_TYPE["ERC721"];

      if (isERC721) {
        const value = orderFulfilledEvent.consideration?.reduce(
          (sum: number, transaction: ReceivedItem) => {
            let value = Number(transaction.amount) / 10 ** 18;
            return sum + value;
          },
          0
        );

        let ethValue = value;
        let unit = "ETH";

        // "0x2f228dc66f863c01a738407Aec38169D728f27a2",
        // "0xabda530dF5D786Ebb1d02Af9961C775B8b1f6447",

        switch (orderFulfilledEvent?.consideration?.[0]?.token) {
          case "0x64D91f12Ece7362F91A6f8E7940Cd55F05060b92":
            const ashToEthRate = 0.00045211;

            ethValue = value * ashToEthRate;
            unit = "ASH";
            break;
          case "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" ||
            "0x79f1C4cF7266746698E91034d658E56913E6644f" ||
            "0xED5AF388653567Af2F388E6224dC7C4b3241C544":
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
      }
      return null;
    },
  },
  {
    hexSignature:
      "0x61cbb2a3dee0b6064c2e681aadd61677fb4ef319f0b547508d495626f5a62f64",
    decode: (topics: string[], data: string): SaleInterface => {
      const hexString: any = data.slice(2).match(/.{1,64}/g);

      const decodedData = hexString.map((chunk: any, index: number) => {
        const isAddress = checkIsAddress(chunk);
        const data = web3.eth.abi.decodeParameter(
          isAddress ? "address" : "uint256",
          chunk
        );

        return data;
      });

      const contract = decodedData?.[7];
      const value = Number(decodedData?.[11]) / 10 ** 18;
      const tokenId = decodedData?.[8];
      const from: any = web3.eth.abi.decodeParameter("address", topics[1]);
      const to: any = web3.eth.abi.decodeParameter("address", topics[2]);

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
    },
  },

  {
    hexSignature:
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    decode: (topics: string[], data: string): any => {
      return {
        action: "Transfer",
        from: web3.eth.abi.decodeParameter("address", topics[1]) as any,
        to: web3.eth.abi.decodeParameter("address", topics[2]) as any,
        tokenId: web3.eth.abi.decodeParameter("uint256", topics[3]) as any,
      };
    },
  },
];

// {
//   hexSignature:
//     "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
//   textSignature:
//     "Approval (index_topic_1 address owner, index_topic_2 address approved, index_topic_3 uint256 tokenId)",
//   functionName: "Approval",
//   type: "ERC721",
//   indexLength: 3,
//   function: (topics: string[], data: string) => {
//     return {
//       name: "Approval",
//       type: "ERC721",
//       owner: web3.eth.abi.decodeParameter("address", topics[1]),
//       approved: web3.eth.abi.decodeParameter("address", topics[2]),
//       tokenId: web3.eth.abi.decodeParameter("uint256", topics[3]),
//     };
//   },
// },
// {
//   hexSignature:
//     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
//   textSignature:
//     "Transfer (index_topic_1 address from, index_topic_2 address to, index_topic_3 uint256 tokenId)",
//   functionName: "Transfer",
//   type: "ERC721",
//   indexLength: 3,
//   function: (topics: string[], data: string) => {
//     return {
//       name: "Transfer",
//       type: "ERC721",
//       from: web3.eth.abi.decodeParameter("address", topics[1]),
//       to: web3.eth.abi.decodeParameter("address", topics[2]),
//       tokenId: web3.eth.abi.decodeParameter("uint256", topics[3]),
//     };
//   },
// },
// {
//   hexSignature:
//     "0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f",
//   textSignature:
//     "Mint (index_topic_1 address sender, uint256 amount0, uint256 amount1)",
//   functionName: "Mint",
//   type: "ERC721",
//   indexLength: 1,
//   function: (topics: string[], data: string) => {
//     return {
//       name: "Mint",
//       type: "ERC721",
//       sender: web3.eth.abi.decodeParameter("address", topics[1]),
//       amount0: web3.eth.abi.decodeParameters(["uint256", "uint256"], data)[0],
//       amount1: web3.eth.abi.decodeParameters(["uint256", "uint256"], data)[1],
//     };
//   },
// },

export const SIGNATURE_LIST = [
  {
    hexSignature:
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    textSignature:
      "Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)",
    functionName: "Transfer",
    type: "ERC20",
    indexLength: 2,
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
      return {
        name: "Transfer",
        type: "ERC721",
        from: web3.eth.abi.decodeParameter("address", topics[1]),
        to: web3.eth.abi.decodeParameter("address", topics[2]),
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
    type: "ERC721",
    indexLength: 1,
    function: (topics: string[], data: string) => {
      return {
        name: "Mint",
        type: "ERC721",
        sender: web3.eth.abi.decodeParameter("address", topics[1]),
        amount0: web3.eth.abi.decodeParameters(["uint256", "uint256"], data)[0],
        amount1: web3.eth.abi.decodeParameters(["uint256", "uint256"], data)[1],
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
    function: (topics: string[], data: string) => {
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
    function: (topics: string[], data: string) => {
      const result = web3.eth.abi.decodeParameters(
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
    function: (topics: string[], data: string) => {
      const chunks: any = data.match(/.{1,64}/g);

      const decodedNumbers = chunks.map((chunk: any) =>
        web3.eth.abi.decodeParameter("uint256", "0x" + chunk)
      );

      console.log(decodedNumbers);
      return {
        name: "OrdersMatched",
        type: "ERC721",
        from: web3.eth.abi.decodeParameter("address", topics[1]),
        to: web3.eth.abi.decodeParameter("address", topics[2]),
        tokenId: decodedNumbers[9],
        value: decodedNumbers[12],
      };
    },
  },
];
