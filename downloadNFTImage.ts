import axios from "axios";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import crypto from "crypto";

const axiosInstance = axios.create();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const encrypt = (tokenId: string | number) => {
  const cipher = crypto.createCipher(
    "aes-256-cbc",
    process.env.SECRET as string
  );
  let encrypted = cipher.update(String(tokenId), "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const makeRequest = async ({
  imageUrl,
  server,
  alchemy,
  contractAddress,
  tokenId,
}: any) => {
  try {
    const response = await axiosInstance.get(imageUrl as string, {
      responseType: "arraybuffer",
      maxContentLength: 5 * 1024 * 1024 * 1024, // 3GB
    });

    return {
      isSuccess: true,
      imageUrl: response.data,
      message: "",
    };
  } catch (error: any) {
    const data = await alchemy.nft.getNftMetadata(contractAddress, tokenId);
    if (data.image?.cachedUrl || data.image?.thumbnailUrl) {
      return {
        isSuccess: true,
        imageUrl: data.image?.cachedUrl || data.image?.thumbnailUrl,
        message: "",
      };
    }
    return {
      isSuccess: false,
      imageUrl: "",
      message: error.message,
    };
  }
};

function isMP4(buffer: any) {
  // MP4 파일은 'ftyp' 박스를 포함할 수 있습니다.
  // 이 박스는 파일의 시작 부분 근처에 위치할 수 있으므로,
  // 버퍼의 처음 12바이트 내에서 'ftyp' 시그니처를 찾습니다.
  const signatures = ["66747970", "6d703432"]; // 'ftyp', 'mp42' 시그니처

  for (let i = 0; i < 12; i++) {
    const signature = buffer.toString("hex", i, i + 4);
    if (signatures.includes(signature)) {
      return true;
    }
  }
  return false;
}

function getFileExtension(buffer: any) {
  const signatures: any = {
    ffd8ffe0: "jpg",
    ffd8ffe1: "jpg",
    ffd8ffe2: "jpg",
    ffd8ffe3: "jpg",
    ffd8ffe8: "jpg",
    "89504e47": "png",
    "47494638": "gif",
    "424d": "bmp",
    "52494646": "webp",
    "49492a00": "tiff",
    "4d4d002a": "tiff",
    "4d4d002b": "tiff",
    "00000018": "mp4",
    "00000020": "mp4",
    "66747970": "mp4", // MP4의 경우 더 복잡한 체크가 필요할 수 있음
    "25504446": "pdf",
    "504b0304": "zip",
  };

  const signature = buffer.toString("hex", 0, 4);
  for (let key in signatures) {
    if (signature.startsWith(key)) {
      return signatures[key];
    }
  }

  // 확장자를 찾지 못한 경우, MP4인지 확인
  if (isMP4(buffer)) {
    return "mp4";
  }

  return null;
}

const getUrlExtension = (url: string) => {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  return pathname.slice(((pathname.lastIndexOf(".") - 1) >>> 0) + 2);
};

export const downloadImage = async ({
  imageUrl,
  contractAddress,
  tokenId,
  alchemy,
}: {
  imageUrl: string;
  contractAddress: string;
  tokenId: string | number;
  alchemy: any;
}): Promise<{
  isSuccess: boolean;
  message: string;
  hashedFileName: string;
}> => {
  try {
    let imageData;
    const MAX_SIZE_IN_BYTES = 5 * 1024 * 1024; // 5MB
    const dataUrlPattern = /^data:image\/([a-zA-Z0-9+]+);base64,/;
    const matchResult = imageUrl.match(dataUrlPattern);
    if (matchResult && matchResult[1]) {
      const mimeType = matchResult[1];
      const base64Data = imageUrl.replace(dataUrlPattern, "");
      // 길이 체크
      if (Buffer.from(base64Data, "base64").length > MAX_SIZE_IN_BYTES) {
        console.error(`${mimeType.toUpperCase()} 이미지 데이터가 너무 큽니다.`);
        return {
          isSuccess: true,
          message: `${mimeType.toUpperCase()} 이미지 데이터가 너무 큽니다.`,
          hashedFileName: "",
        }; // 혹은 다른 오류 처리 로직
      }

      imageData = Buffer.from(base64Data, "base64");
    } else {
      let server = "";
      if (imageUrl.startsWith("ipfs://")) {
        let ipfsHash = imageUrl.split("ipfs://")[1];
        if (ipfsHash.startsWith("ipfs/")) {
          ipfsHash = ipfsHash.split("ipfs/")[1];
        }
        imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        server = "ipfs.io";
      } else if (imageUrl.startsWith("ar://")) {
        const arweaveHash = imageUrl.split("ar://")[1];
        imageUrl = `https://arweave.net/${arweaveHash}`;
        server = "arweave.net";
      } else {
        server = imageUrl.split("/")[2];
      }

      const {
        isSuccess,
        imageUrl: fetchedImageUrl,
        message: fetchedMessage,
      } = await makeRequest({
        imageUrl,
        server,
        alchemy,
        contractAddress,
        tokenId,
      });

      if (!isSuccess) {
        return {
          isSuccess: true,
          message: fetchedMessage,
          hashedFileName: "",
        };
      }
      imageData = fetchedImageUrl;
    }

    let baseDirectory = __dirname;

    if (IS_PRODUCTION) {
      baseDirectory = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "assets-storage",
        "images",
        contractAddress
      );
    }

    let format = getUrlExtension(imageUrl);
    if (!format) format = getFileExtension(imageData);
    if (!format) format = "png";

    let hashedFileName;

    if (format === "svg+xml") {
      hashedFileName = encrypt(tokenId) + ".png";
    } else if (format === "mp4") {
      hashedFileName = encrypt(tokenId) + ".gif";
    } else {
      hashedFileName = encrypt(tokenId) + `.${format}`;
    }

    const thumbnailPath = path.join(baseDirectory, "thumbnail");
    // No special case for mp4 anymore
    if (!fs.existsSync(thumbnailPath)) {
      fs.mkdirSync(thumbnailPath, { recursive: true });
    }
    if (["jpeg", "jpg", "png", "webp", "tiff"].includes(format)) {
      // For image formats that Sharp can handle, we resize and change format
      const transformer = sharp(imageData)
        .resize(200)
        .toFormat(format as any);
      await transformer.toFile(path.join(thumbnailPath, hashedFileName));
    } else if (format === "svg+xml") {
      // SVG를 PNG로 변환
      const pngImage = await sharp(imageData).resize(512, 512).png().toBuffer();

      fs.writeFileSync(path.join(thumbnailPath, hashedFileName), pngImage);
    } else if (format === "gif") {
      const tempFilePath = path.join(
        thumbnailPath,
        `${encrypt(tokenId)}_temp.gif`
      );

      fs.writeFileSync(tempFilePath, imageData);

      const outputPath = path.join(thumbnailPath, hashedFileName);
      await new Promise((resolve, reject) => {
        ffmpeg(tempFilePath)
          .outputOptions("-vf scale=200:-1") // Resize the GIF
          .output(outputPath)
          .on("end", () => {
            fs.unlinkSync(tempFilePath); // Delete the original, unprocessed GIF file
            resolve(undefined);
          })
          .on("error", (err: any) => {
            console.error("ffmpeg processing error:", err);
            fs.unlinkSync(tempFilePath);
            reject(err);
            return {
              isSuccess: false,
              message: err.message,
              hashedFileName: "",
            };
          })
          .run(); // Run the command
      });
    } else if (format === "mp4") {
      const tempFilePath = path.join(
        thumbnailPath,
        `${encrypt(tokenId)}_temp.mp4`
      );

      fs.writeFileSync(tempFilePath, imageData);

      const outputPath = path.join(thumbnailPath, hashedFileName);

      try {
        await new Promise((resolve, reject) => {
          ffmpeg(tempFilePath)
            .outputOptions("-vf", "scale=320:-1") // scale filter for resizing, you can adjust as needed
            .outputOptions("-r 10") // Set frame rate (Hz value, fraction or abbreviation), adjust as needed
            .toFormat("gif")
            .output(outputPath)
            .on("end", () => {
              fs.unlinkSync(tempFilePath); // Delete the original, unprocessed video file
              resolve(undefined);
            })
            .on("error", (err: any) => {
              console.error("ffmpeg processing error:", err);
              fs.unlinkSync(tempFilePath);
              reject(err);
              return {
                isSuccess: false,
                message: err.message,
                hashedFileName: "",
              };
            })
            .run(); // Run the command
        });
      } catch (e: any) {
        console.error("ffmpeg processing error:", e);
        throw e;
      }
    } else {
      fs.writeFileSync(path.join(thumbnailPath, hashedFileName), imageData);
    }
    console.log(`${contractAddress} / ${tokenId} 이미지 생성`);
    return { isSuccess: true, message: "", hashedFileName };
  } catch (error: any) {
    return {
      isSuccess: false,
      message: error.message,
      hashedFileName: "",
    };
  }
};
