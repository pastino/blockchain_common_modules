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
