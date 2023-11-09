import { ERC_1155_ABI, ERC_20_ABI, ERC_721_ABI } from "./ABI";
import { web3 as cunnectedWeb3 } from "./web3";
import { Contract } from "web3-eth-contract";

import Web3 from "web3";
const web3 = new Web3();

export const sleep = (sec: number) => {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
};

export function checkIsAddress(str: string) {
  if (typeof str !== "string") {
    return false;
  }

  const zeroPrefixLength = 24;
  const zeroOptionalLength = 26;
  const minLength = 27;

  if (str.length < minLength) {
    return false;
  }

  for (let i = 0; i < zeroPrefixLength; i++) {
    if (str[i] !== "0") {
      return false;
    }
  }

  let hasNonZeroChar = false;
  for (let i = zeroPrefixLength; i < zeroOptionalLength; i++) {
    if (str[i] !== "0") {
      hasNonZeroChar = true;
      break;
    }
  }

  if (!hasNonZeroChar) {
    return false;
  }

  return true;
}

export const BLUR_TYPE = [
  "uint256",
  "hex",
  "uint256",
  "hex",
  "address",
  "uint256",
  "address",
  "address",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "address",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
];

export const X2Y2_TYPE = [
  "address", // from
  "address", // to
  "hex",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256", // value
  "uint256",
  "uint256",
  "uint256",
  "uint256", // count
  "address", // contract
  "uint256", // tokenId
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "hex",
  "address",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
  "uint256",
];

export const unpackTokenIdListingIndexTrader = (value: bigint) => {
  const tokenId = Number(value >> BigInt(21 * 8));
  const listingIndex = Number(value & BigInt("0xFFFFFFFFFF"));
  value >>= BigInt(40);
  const trader = (
    value & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
  ).toString(16);
  const traderHex = trader === "0" ? "0" : "0x" + trader;
  value >>= BigInt(160);
  return { tokenId, listingIndex, trader: traderHex };
};

export const unpackCollectionPriceSide = (value: bigint) => {
  const collection = (
    value & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
  )
    .toString(16)
    .padStart(40, "0");

  const collectionHex = "0x" + collection;
  value >>= BigInt(160);

  const price = Number(value & BigInt("0xFFFFFFFFFFFFFFFF"));
  value >>= BigInt(88);
  const orderType = Number(value);
  return { orderType, price, collection: collectionHex };
};

export const unpackTakerFeeRecipientRate = (value: bigint) => {
  const recipient = (
    value & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
  ).toString(16);
  const recipientHex = recipient === "0" ? "0" : "0x" + recipient;
  value >>= BigInt(160);
  const rate = Number(value);
  return { rate, recipient: recipientHex };
};

export const findTargetLogFromTo = (tokenId: string, logs: any[]) => {
  // Transfer log인지 확인
  const hasThirdTopicLogs = logs.filter(
    (log) =>
      log.topics[0] ===
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
      log.topics?.length === 4
  );

  // Transfer log 아니면 중단
  if (hasThirdTopicLogs?.length === 0) return;

  // Transfer log 중에서 tokenId가 일치하는 log 찾기
  const targetTransferLog = hasThirdTopicLogs.find(
    (log: any) =>
      log.topics[0] ===
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
      String(web3.eth.abi.decodeParameters(["uint256"], log.topics[3])[0]) ===
        String(tokenId)
  );

  // 일치하는 log가 없으면 중단
  if (!targetTransferLog) return;

  // nft 전송 이벤트의 from, to 주소 추출
  const from = web3.eth.abi.decodeParameter(
    "address",
    targetTransferLog.topics[1]
  ) as any;
  const to = web3.eth.abi.decodeParameter(
    "address",
    targetTransferLog.topics[2]
  ) as any;

  return { from, to };
};

export const getContractDetails = async (
  address: string,
  tokenId: number | string
) => {
  const ERC20Contract = new cunnectedWeb3.eth.Contract(ERC_20_ABI, address);
  const ERC721Contract = new cunnectedWeb3.eth.Contract(ERC_721_ABI, address);
  const ERC1155Contract = new cunnectedWeb3.eth.Contract(ERC_1155_ABI, address);

  let contractDetails = {
    address: address,
    name: null,
    symbol: null,
    totalSupply: null,
    tokenType: null as string | null,
    description: null, // 추후 description 처리를 위해 추가하였습니다.
  };

  try {
    const name = await ERC20Contract.methods.name().call();
    contractDetails.name = name;
  } catch (e) {
    // console.error("Error fetching name:", e);
  }

  try {
    const symbol = await ERC20Contract.methods.symbol().call();
    contractDetails.symbol = symbol;
  } catch (e) {
    // console.error("Error fetching name:", e);
  }

  try {
    const totalSupply = await ERC20Contract.methods.totalSupply().call();
    contractDetails.totalSupply = totalSupply;
  } catch (e) {
    // console.error("Error fetching name:", e);
  }

  try {
    await ERC721Contract.methods.ownerOf(tokenId).call();
    contractDetails.tokenType = "ERC721";
  } catch (error) {}

  if (!contractDetails.tokenType) {
    try {
      await ERC1155Contract.methods
        .balanceOf("0xD37E2eA8373b17E2e3f8825E5a83aeD319ddF52d", tokenId)
        .call();
      contractDetails.tokenType = "ERC1155";
    } catch (error) {}
  }

  return contractDetails;
};

function decodeBase64Json(base64Encoded: string) {
  const jsonString = Buffer.from(base64Encoded, "base64").toString("utf-8"); // Base64 디코딩
  return JSON.parse(jsonString); // JSON 파싱
}

export const getNFTDetails = async (
  address: string,
  tokenId: number | string
) => {
  const ERC721Contract = new cunnectedWeb3.eth.Contract(ERC_721_ABI, address);
  const ERC1155Contract = new cunnectedWeb3.eth.Contract(ERC_1155_ABI, address);
  let nftDetails = {
    tokenId,
    title: null as string | null,
    description: null,
    imageUri: null,
    attribute: null,
    tokenType: null as string | null,
    attributesRaw: null,
  };

  try {
    await ERC721Contract.methods.ownerOf(tokenId).call();
    nftDetails.tokenType = "ERC721";
  } catch (error) {}

  if (!nftDetails.tokenType) {
    try {
      await ERC1155Contract.methods
        .balanceOf("0xD37E2eA8373b17E2e3f8825E5a83aeD319ddF52d", tokenId)
        .call();
      nftDetails.tokenType = "ERC1155";
    } catch (error) {}
  }

  const fetchAndSetNFTDetails = async (
    contract: Contract,
    uriMethod: string
  ) => {
    try {
      let uri = await contract.methods[uriMethod](tokenId).call();

      uri = uri.replace("{id}", tokenId.toString());
      if (!uri) return;

      if (uri.startsWith("ar://")) {
        uri = uri.replace("ar://", "https://arweave.net/");
      } else if (uri.startsWith("ipfs://")) {
        uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      }

      let metadata;
      if (uri.startsWith("data:application/json;")) {
        const contentIndex = uri.indexOf(",");
        const content = uri.substring(contentIndex + 1);

        if (uri.startsWith("data:application/json;base64,")) {
          metadata = decodeBase64Json(uri.split(",")[1]);
        } else if (uri.startsWith("data:application/json;utf8,")) {
          metadata = JSON.parse(decodeURIComponent(content));
        } else {
          console.log("uri", uri);
        }
      } else {
        try {
          metadata = await fetch(uri).then((response) => response.json());
        } catch (e) {}
      }

      nftDetails.title = metadata?.name ? String(metadata?.name) : "";
      nftDetails.description = metadata?.description || "";
      nftDetails.imageUri = metadata?.image || metadata?.animation_url;
      nftDetails.attribute = metadata?.attributes || [];
      nftDetails.attributesRaw = uri;
    } catch (error) {
      console.error("Error fetching NFT details:", error);
    }
  };

  if (nftDetails.tokenType === "ERC1155") {
    await fetchAndSetNFTDetails(ERC1155Contract, "uri");
  } else if (nftDetails.tokenType === "ERC721") {
    await fetchAndSetNFTDetails(ERC721Contract, "tokenURI");
  }

  return nftDetails;
};
