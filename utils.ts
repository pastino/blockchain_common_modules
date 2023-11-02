import { ERC_1155_ABI, ERC_20_ABI, ERC_721_ABI } from "./ABI";
import web3 from "./web3";

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
  const targetTransferLog = logs.find(
    (log) =>
      log.topics[0] ===
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
      String(web3.eth.abi.decodeParameters(["uint256"], log.topics[3])[0]) ===
        String(tokenId)
  );

  if (!targetTransferLog) return;

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
  const ERC20Contract = new web3.eth.Contract(ERC_20_ABI, address);
  const ERC721Contract = new web3.eth.Contract(ERC_721_ABI, address);
  const ERC1155Contract = new web3.eth.Contract(ERC_1155_ABI, address);

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
  } catch (e) {}

  try {
    const symbol = await ERC20Contract.methods.symbol().call();
    contractDetails.symbol = symbol;
  } catch (e) {}

  try {
    const totalSupply = await ERC20Contract.methods.totalSupply().call();
    contractDetails.totalSupply = totalSupply;
  } catch (e) {}

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

function decodeBase64Json(uri: string) {
  const base64Encoded = uri.split(",")[1];
  const jsonString = Buffer.from(base64Encoded, "base64").toString("utf-8"); // Base64 디코딩
  return JSON.parse(jsonString); // JSON 파싱
}

export const getNFTDetails = async (
  address: string,
  tokenId: number | string
) => {
  const ERC721Contract = new web3.eth.Contract(ERC_721_ABI, address);
  const ERC1155Contract = new web3.eth.Contract(ERC_1155_ABI, address);
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
  } catch (error) {
    console.log("This contract might not be an ERC-721 token");
  }
  if (!nftDetails.tokenType) {
    try {
      await ERC1155Contract.methods
        .balanceOf("0xD37E2eA8373b17E2e3f8825E5a83aeD319ddF52d", tokenId)
        .call();
      nftDetails.tokenType = "ERC1155";
    } catch (error) {
      console.log("This contract might not be an ERC-1155 token");
    }
  }
  if (nftDetails.tokenType === "ERC1155") {
    try {
      const pattern = await ERC1155Contract.methods.uri(tokenId).call();
      let uri = pattern.replace("{id}", tokenId.toString());
      if (uri.startsWith("ipfs://")) {
        uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      }
      if (uri.startsWith("data:application/json;base64,")) {
        const metadata = decodeBase64Json(uri);
        nftDetails.title = String(metadata.name);
        nftDetails.description = metadata.description;
        nftDetails.imageUri = metadata.image;
        nftDetails.attribute = metadata.attributes;
        nftDetails.attributesRaw = uri;
      } else {
        const metadata = await fetch(uri).then((response) => response.json());
        nftDetails.title = String(metadata.name);
        nftDetails.description = metadata.description;
        nftDetails.imageUri = metadata.image;
        nftDetails.attribute = metadata.attributes; // Assuming the metadata contains an "attributes" field
        nftDetails.attributesRaw = uri;
      }
    } catch (error) {
      console.log("Error fetching ERC1155 token details:", error);
    }
  } else if (nftDetails.tokenType === "ERC721") {
    try {
      let uri = await ERC721Contract.methods.tokenURI(tokenId).call();
      if (uri.startsWith("ipfs://")) {
        uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      }

      if (uri.startsWith("data:application/json;base64,")) {
        const metadata = decodeBase64Json(uri);
        nftDetails.title = String(metadata.name);
        nftDetails.description = metadata.description;
        nftDetails.imageUri = metadata.image;
        nftDetails.attribute = metadata.attributes;
        nftDetails.attributesRaw = uri;
      } else {
        const metadata = await fetch(uri).then((response) => response.json());
        nftDetails.title = String(metadata.name);
        nftDetails.description = metadata.description;
        nftDetails.imageUri = metadata.image;
        nftDetails.attribute = metadata.attributes; // Assuming the metadata contains an "attributes" field
      }

      nftDetails.attributesRaw = uri;
    } catch (error) {
      console.log("Error fetching ERC721 token details:", error);
    }
  }

  return nftDetails;
};
