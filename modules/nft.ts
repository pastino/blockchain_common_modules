import { getRepository } from "typeorm";
import { Contract, Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import axios, { AxiosResponse } from "axios";
import { getNFTDetails, sleep } from "../utils";
import crypto from "crypto";
import { downloadImage } from "../downloadNFTImage";
import { Attribute } from "../entities/Attribute";
import { AttributeProperty } from "../entities/AttributeProperty";
import { alchemy } from "../blockEventHandler";

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
      // v1 삭제됨. v2로 변경 필요
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
    const attributeRepo = getRepository(Attribute);
    const attributePropertyRepo = getRepository(AttributeProperty);
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

        let attribute = await attributeRepo.findOne({
          where: { traitType: attributeData.trait_type, contract },
        });

        if (!attribute) {
          try {
            attribute = new Attribute();
            attribute.traitType = attributeData.trait_type;
            attribute.contract = contract;
            attribute = await attributeRepo.save(attribute);
          } catch (error: any) {
            if (error.code === "23505") {
              // Duplicate key error
              attribute = await attributeRepo.findOne({
                where: { traitType: attributeData.trait_type, contract },
              });
            } else {
              throw error;
            }
          }
        }

        if (!attribute) throw `Failed to find or save attribute`;

        let attributeProperty = await attributePropertyRepo.findOne({
          where: {
            value: attributeData.value,
            attribute,
            nft,
          },
        });

        if (!attributeProperty) {
          try {
            attributeProperty = new AttributeProperty();
            attributeProperty.value = attributeData.value;
            attributeProperty.attribute = attribute;
            attributeProperty.nft = nft;

            await attributePropertyRepo.save(attributeProperty);
          } catch (error: any) {
            if (error.code === "23505") {
              // Duplicate key error
              attributeProperty = await attributePropertyRepo.findOne({
                where: {
                  value: attributeData.value,
                  attribute,
                  nft,
                },
              });
              if (!attributeProperty)
                throw `Failed to find or save attribute property`;
            } else {
              throw error;
            }
          }
        }
      }
      await getRepository(NFTEntity).update(
        { id: nft.id },
        {
          isAttributeUpdated: true,
        }
      );
    } catch (e) {
      throw e;
    }
  }

  async createNFTAndAttributes(nftData: any) {
    try {
      const sanitizeText = (text: string) => (text || "").replace(/\x00/g, "");

      const truncateTitle = (title: string) =>
        title.length > 500 ? title.slice(0, 500) : title;

      let imageAlchemyUrl = "";
      let imageAlchemyError = "";
      try {
        const alchemyNFTData = await alchemy.nft.getNftMetadata(
          this.contract.address,
          this.tokenId
        );
        imageAlchemyUrl = alchemyNFTData?.media?.[0]?.thumbnail || "";
      } catch (e: any) {
        imageAlchemyError = e.message;
      }

      const saveData = {
        ...nftData,
        isAttributeUpdated: false,
        title: sanitizeText(truncateTitle(nftData.title || "")) || "",
        description: sanitizeText(nftData.description || "") || "",
        contract: this.contract,
        attributesRaw: sanitizeText(nftData.attributesRaw || "") || "",
        imageRaw: sanitizeText(nftData.imageUri || "") || "",
        imageAlchemyUrl,
      };

      if (imageAlchemyError) saveData.imageAlchemyError = imageAlchemyError;

      const nft = await getRepository(NFTEntity).save(saveData);

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

  async saveNFT(isUpdate: boolean = false) {
    let nftData: any;

    let nft = await getRepository(NFTEntity).findOne({
      where: {
        contract: this.contract as any,
        tokenId: this.tokenId as any,
      },
    });

    if (nft && !isUpdate) {
      if (!nft.isAttributeUpdated) {
        const nftDetail = await getNFTDetails(
          this.contract.address,
          this.tokenId
        );

        if (nftDetail && nftDetail.attribute && nftDetail.attribute.length > 0)
          await this.saveAttributes(nft, this.contract, nftDetail.attribute);
      }
      return nft;
    }
    try {
      nftData = await getNFTDetails(this.contract.address, this.tokenId);
      if (isUpdate) {
        nftData.id = nft?.id;
      }

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
      if (process.env.IS_SAVE_IMAGE === "NO") return nft;
      // NFT 이미지 생성
      try {
        if (nft?.imageRoute) return nft;
        if (!nft || !nft?.imageRaw) {
          let failedMessage = "";
          if (!nft) failedMessage = "nft가 없습니다.";
          if (!nft?.imageRaw) failedMessage = "이미지 url이 없습니다.";
          await getRepository(NFTEntity).update(
            { id: nft?.id },
            { isImageUploaded: false, imageSaveError: failedMessage }
          );
          return nft;
        }
        const { isSuccess, message, hashedFileName } = await downloadImage({
          imageUrl:
            typeof nftData?.imageUri === "string"
              ? nftData?.imageUri.replace(/\x00/g, "")
              : "",
          contractAddress: this.contract.address,
          tokenId: this.tokenId,
        });
        if (!isSuccess) {
          await getRepository(NFTEntity).update(
            { id: nft?.id },
            { isImageUploaded: false, imageSaveError: message }
          );
          return nft;
        }
        await getRepository(NFTEntity).update(
          { id: nft?.id },
          {
            imageRoute: hashedFileName,
            isImageUploaded: true,
          }
        );
        return nft;
      } catch (e) {
        null;
      }
    }
  }
}
