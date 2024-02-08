import { ERC_1155_ABI, ERC_20_ABI, ERC_721_ABI } from "./ABI";
import { web3 as connectedWeb3 } from "./web3";
import { Contract } from "web3-eth-contract";
import axios from "axios";
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

// async function getContractCreationDate(contractAddress: string) {
//   console.log("contractAddress", contractAddress);

//   const tx = await web3.eth.getTransactionFromBlock(contractAddress, 0);
//   console.log("tx", tx);
//   const block = await web3.eth.getBlock(tx.blockNumber as number, true);
//   return block.timestamp;
// }

// async function getContractCreationDate(contractAddress: string) {
//   const blockNumber = await web3.eth.getBlockNumber(); // 현재 블록 번호를 가져옴

//   for (let i = blockNumber; i >= 0; i--) {
//     const block = await web3.eth.getBlock(i, true);
//     for (const tx of block.transactions) {
//       if (
//         tx.to === null &&
//         tx.from.toLowerCase() === contractAddress.toLowerCase()
//       ) {
//         // 컨트랙트 생성 트랜잭션 발견
//         return block.timestamp;
//       }
//     }
//   }

//   throw new Error("컨트랙트 생성 트랜잭션을 찾을 수 없음");
// }

export const getContractDetails = async (
  address: string,
  tokenId: number | string,
  alchemy: any
) => {
  const ERC20Contract = new connectedWeb3.eth.Contract(ERC_20_ABI, address);
  const ERC721Contract = new connectedWeb3.eth.Contract(ERC_721_ABI, address);
  const ERC1155Contract = new connectedWeb3.eth.Contract(ERC_1155_ABI, address);

  let contractDetails = {
    address: address,
    name: null,
    symbol: null,
    totalSupply: null,
    tokenType: null as string | null,
    description: null,
    contractDeployer: "",
    deployedBlockNumber: 0,
    createdDate: null as Date | null,
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

  try {
    const contractDataByAlchemy = await alchemy.nft.getContractMetadata(
      address
    );
    const contractDeployer = contractDataByAlchemy?.contractDeployer;
    const deployedBlockNumber = contractDataByAlchemy?.deployedBlockNumber;
    if (contractDeployer) contractDetails.contractDeployer = contractDeployer;
    if (deployedBlockNumber) {
      contractDetails.deployedBlockNumber = deployedBlockNumber;

      if (deployedBlockNumber) {
        const blockData = await connectedWeb3.eth.getBlock(deployedBlockNumber);

        if (blockData && !isNaN(blockData.timestamp)) {
          const createdDate = new Date(Number(blockData.timestamp) * 1000);

          createdDate.setMinutes(
            createdDate.getMinutes() + createdDate.getTimezoneOffset()
          );

          contractDetails.createdDate = createdDate;
        }
      }
    }
  } catch (error) {}

  return contractDetails;
};

function decodeBase64Json(base64Encoded: string) {
  const jsonString = Buffer.from(base64Encoded, "base64").toString("utf-8"); // Base64 디코딩
  return JSON.parse(jsonString); // JSON 파싱
}

const getAttributeByNetwork = async (uri: string) => {
  try {
    const response = await axios.get(uri, {
      timeout: 10000, // 10초 후 타임아웃
    });
    const data = response?.data;

    return {
      attributesRaw: uri,
      title: data?.name ? String(data?.name) : "",
      description: data?.description || "",
      imageUri: data?.image || data?.animation_url,
      attribute: data?.attributes || [],
    };
  } catch (error: any) {
    throw error;
  }
};

export interface MetaData {
  name?: "";
  description?: "";
  image?: "";
  animation_url?: "";
  attributes?: any[];
}

export const fetchAndSetNFTDetails = async (uri: string): Promise<MetaData> => {
  try {
    let metadata;

    if (uri.startsWith("data:application/json;")) {
      const contentIndex = uri.indexOf(",");
      const content = uri.substring(contentIndex + 1);

      if (uri.includes("base64,")) {
        metadata = decodeBase64Json(content);
      } else {
        let decodedContent = decodeURIComponent(content);
        metadata = JSON.parse(decodedContent);
      }
    } else {
      const data = await getAttributeByNetwork(uri);
      metadata = data;
    }

    return metadata;
  } catch (error: any) {
    throw error;
  }
};

const getAttributeUriByTokenId = async ({
  contractModule,
  method,
  tokenId,
}: {
  contractModule: Contract;
  method: string;
  tokenId: number | string;
}) => {
  try {
    let uri = await contractModule.methods[method](tokenId).call();

    uri = uri.replace("{id}", tokenId.toString());

    if (!uri) return "";

    if (uri.startsWith("ar://")) {
      uri = uri.replace("ar://", "https://arweave.net/");
    } else if (uri.startsWith("ipfs://")) {
      uri = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }
    return uri;
  } catch (e) {
    throw e;
  }
};

export const getNFTDetails = async (
  address: string,
  tokenId: number | string,
  alchemy: any
) => {
  const ERC721Contract = new connectedWeb3.eth.Contract(ERC_721_ABI, address);
  const ERC1155Contract = new connectedWeb3.eth.Contract(ERC_1155_ABI, address);
  let nftDetails = {
    tokenId,
    title: null,
    description: null,
    imageUri: null,
    attribute: [],
    tokenType: null,
    attributesRaw: null,
    imageAlchemyUrl: null,
    processingStatus: 1,
  };

  async function tryFetchMetadataFromAlchemy() {
    try {
      const data = await alchemy.nft.getNftMetadata(address, tokenId);
      if (data) {
        return {
          ...nftDetails,
          title: data?.title || data?.rawMetadata?.name || null,
          description:
            data?.description || data?.rawMetadata?.description || null,
          tokenType: data?.tokenType,
          imageUri: data?.media?.[0]?.raw,
          attribute: data?.rawMetadata?.attributes || [],
          attributesRaw: data?.tokenUri?.raw || null,
          imageAlchemyUrl: data?.media?.[0]?.thumbnail || null,
          processingStatus: 3,
        };
      }
    } catch (error) {
      console.error("Failed to fetch NFT details from Alchemy:", error);
      throw new Error("Alchemy data fetch failed");
    }
  }

  try {
    let uri = await getAttributeUriByTokenId({
      contractModule: ERC721Contract,
      method: "tokenURI",
      tokenId,
    }).catch(() =>
      getAttributeUriByTokenId({
        contractModule: ERC1155Contract,
        method: "uri",
        tokenId,
      })
    );

    if (!uri) {
      // If getting URI fails, try fetching metadata from Alchemy
      const alchemyDetails = await tryFetchMetadataFromAlchemy();
      if (alchemyDetails) {
        return { isSuccess: true, nftDetail: alchemyDetails, message: "성공" };
      } else {
        throw new Error(
          "Failed to fetch NFT details from both contract and Alchemy"
        );
      }
    }

    try {
      const metadata = await fetchAndSetNFTDetails(uri);
      return {
        isSuccess: true,
        nftDetail: {
          ...nftDetails,
          ...metadata,
          attributesRaw: uri,
          processingStatus: 3,
        },
        message: "성공",
      };
    } catch (error) {
      const updatedDetails = await tryFetchMetadataFromAlchemy();
      return { isSuccess: true, nftDetail: updatedDetails, message: "성공" };
    }
  } catch (error: any) {
    // If all attempts fail, including Alchemy
    return {
      isSuccess: false,
      nftDetail: nftDetails,
      message: error.message || "Failed to process NFT details",
    };
  }
};
