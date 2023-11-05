import { getRepository } from "typeorm";
import { Contract, Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { alchemy } from "../blockEventHandler";
import axios, { AxiosResponse } from "axios";
import { getNFTDetails, sleep } from "../utils";
import crypto from "crypto";
import { TraitType } from "../entities/TraitType";
import { AttributeNFT } from "../entities/AttributeNFT";
import { TraitTypeContract } from "../entities/TraitTypeContract";
import { Attribute } from "../entities/Attribute";
import Bottleneck from "bottleneck";
import { downloadImage } from "../downloadNFTImage";

const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

export class NFT {
  private contract: ContractEntity;
  private tokenId: number | string;

  constructor({
    contract,
    tokenId,
  }: {
    contract: ContractEntity;
    tokenId: number | string;
  }) {
    this.contract = contract;
    this.tokenId = tokenId;
  }

  async handleOpenseaNFT(
    contractAddress: string,
    tokenId: string | number,
    retryCount: number = 10
  ): Promise<AxiosResponse | undefined> {
    try {
      const response = await axios.get(
        `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}`,
        openSeaConfig
      );

      return response;
    } catch (e: any) {
      if (e.response && e.response.status !== 404) {
        if (retryCount > 0) {
          await sleep(3);
          return this.handleOpenseaNFT(
            contractAddress,
            tokenId,
            retryCount - 1
          );
        } else {
          throw e;
        }
      }
    }
  }

  encrypt(tokenId: string | number) {
    const cipher = crypto.createCipher(
      "aes-256-cbc",
      process.env.SECRET as string
    );
    let encrypted = cipher.update(String(tokenId), "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  decrypt(encrypted: string) {
    const decipher = crypto.createDecipher(
      "aes-256-cbc",
      process.env.SECRET as string
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  async saveAttributes(
    nft: NFTEntity,
    contract: ContractEntity,
    attributesData: any[]
  ) {
    const traitTypeRepo = getRepository(TraitType);
    const attributeRepo = getRepository(Attribute);
    const attributeNFTRepo = getRepository(AttributeNFT);
    const traitTypeContractRepo = getRepository(TraitTypeContract);

    try {
      for (const attributeData of attributesData) {
        if (
          !attributeData ||
          !attributeData.trait_type ||
          typeof attributeData.trait_type !== "string" ||
          !attributeData.value ||
          typeof attributeData.value !== "string" ||
          attributeData.value.length > 100
        )
          continue;

        // TraitType이 이미 생성되었는지 확인 후, 없으면 생성
        let traitType = await traitTypeRepo.findOne({
          where: { traitType: attributeData.trait_type },
        });
        if (!traitType) {
          traitType = new TraitType();
          traitType.traitType = attributeData.trait_type;
          traitType = await traitTypeRepo.save(traitType);
        }

        // TraitTypeContract이 이미 생성되었는지 확인 후, 없으면 생성
        let traitTypeContract = await traitTypeContractRepo.findOne({
          where: {
            traitType: traitType as any,
            contract: contract as any,
          },
        });
        if (!traitTypeContract) {
          traitTypeContract = new TraitTypeContract();
          traitTypeContract.traitType = traitType;
          traitTypeContract.contract = contract;
          traitTypeContract = await traitTypeContractRepo.save(
            traitTypeContract
          );
        }

        // Attribute이 이미 생성되었는지 확인 후, 없으면 생성
        let attribute = await attributeRepo.findOne({
          where: {
            value: attributeData.value,
            traitType: traitType as any,
          },
        });
        if (!attribute) {
          attribute = new Attribute();
          attribute.value = attributeData.value;
          attribute.traitType = traitType;
          attribute = await attributeRepo.save(attribute);
        }

        // AttributeNFT 생성
        const attributeNFT = new AttributeNFT();
        attributeNFT.nft = nft;
        attributeNFT.attribute = attribute;
        await attributeNFTRepo.save(attributeNFT);
      }
    } catch (e) {
      throw e;
    }
  }

  async createNFTAndAttributes(nftData: any) {
    try {
      const sanitizeText = (text: string) => (text || "").replace(/\x00/g, "");

      const truncateTitle = (title: string) =>
        title.length > 500 ? title.slice(0, 500) : title;

      const nft = await getRepository(NFTEntity).save({
        ...nftData,
        isAttributeUpdated: true,
        title: sanitizeText(truncateTitle(nftData.title || "")) || "",
        description: sanitizeText(nftData.description || "") || "",
        contract: this.contract,
        attributesRaw: sanitizeText(nftData.attributesRaw || "") || "",
        imageRaw: sanitizeText(nftData.imageUri || "") || "",
      });

      if (!this.contract.description) {
        await getRepository(Contract).update(
          { id: this.contract.id },
          { description: sanitizeText(nftData.description || "") }
        );
      }

      if (nft && nftData.attribute && nftData.attribute.length > 0) {
        await this.saveAttributes(nft, this.contract, nftData.attribute);
      }
      return nft;
    } catch (e) {
      throw e;
    }
  }

  async createImage({
    nftId,
    contractAddress,
    imageUrl,
    tokenId,
    format,
  }: {
    nftId: number;
    contractAddress: string;
    imageUrl: string;
    tokenId: string | number;
    format: string;
  }) {
    try {
      await axios.post(
        "http://121.168.75.64/image",
        {
          nftId,
          contractAddress,
          imageUrl,
          tokenId,
          format,
        },
        {
          timeout: 600000 * 6, // 타임아웃을 1시간으로 설정
        }
      );
    } catch (e) {
      null;
    }
  }

  async saveNFTForCollection(nftData: any) {
    let nft = await getRepository(NFTEntity).findOne({
      where: {
        contract: this.contract as any,
        tokenId: this.tokenId as any,
      },
    });

    if (nft) {
      return nft;
    }

    try {
      try {
        nft = await this.createNFTAndAttributes(nftData);
      } catch (e: any) {
        if (e.code === "23505") {
          nft = await getRepository(NFTEntity).findOne({
            where: {
              contract: this.contract as any,
              tokenId: this.tokenId as any,
            },
          });
        } else {
          throw e;
        }
      }

      if (!nft) {
        throw `Failed to find or save nft`;
      }

      return nft;
    } catch (e: any) {
      throw e;
    } finally {
      // NFT 이미지 생성 api/
      try {
        if (nft?.imageRoute) return;
        this.createImage({
          nftId: nft?.id as number,
          contractAddress: this.contract.address,
          imageUrl:
            typeof nftData.rawMetadata?.image === "string"
              ? nftData.rawMetadata?.image.replace(/\x00/g, "")
              : "",
          tokenId: this.tokenId,
          format: nftData.media?.[0]?.format,
        });
      } catch (e) {
        null;
      }
    }
  }

  async saveNFT() {
    let nftData: any;
    let nft = await getRepository(NFTEntity).findOne({
      where: {
        contract: this.contract as any,
        tokenId: this.tokenId as any,
      },
    });

    if (nft) {
      return nft;
    }

    try {
      nftData = await getNFTDetails(this.contract.address, this.tokenId);

      try {
        nft = await this.createNFTAndAttributes(nftData);
      } catch (e: any) {
        console.log("에러");
        if (e.code === "23505") {
          nft = await getRepository(NFTEntity).findOne({
            where: {
              contract: this.contract as any,
              tokenId: this.tokenId as any,
            },
          });
        } else {
          throw e;
        }
      }

      if (!nft) {
        throw `Failed to find or save nft`;
      }

      return nft;
    } catch (e: any) {
      throw e;
    } finally {
      // NFT 이미지 생성
      try {
        if (nft?.imageRoute) return;
        if (!nft || !nft?.imageRaw) {
          let failedMessage = "";
          if (!nft) failedMessage = "nft가 없습니다.";
          if (!nft?.imageRaw) failedMessage = "이미지 url이 없습니다.";
          await getRepository(NFTEntity).update(
            { id: nft?.id },
            { isImageUploaded: false, imageSaveError: failedMessage }
          );
          return;
        }
        const { isSuccess, message, hashedFileName } = await downloadImage({
          imageUrl:
            typeof nftData.rawMetadata?.image === "string"
              ? nftData.rawMetadata?.image.replace(/\x00/g, "")
              : "",
          contractAddress: this.contract.address,
          tokenId: this.tokenId,
        });

        if (!isSuccess) {
          await getRepository(NFTEntity).update(
            { id: nft?.id },
            { isImageUploaded: false, imageSaveError: message }
          );
          return;
        }

        nft.imageRoute = hashedFileName;
        nft.isImageUploaded = true;
        await getRepository(NFTEntity).update({ id: nft?.id }, nft);
        console.log("파일을 다운로드하고 저장했습니다.");
      } catch (e) {
        null;
      }
    }
  }
}
