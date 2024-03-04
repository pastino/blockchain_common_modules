import { getRepository } from "typeorm";
import { Contract, Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import axios, { AxiosResponse } from "axios";
import { getNFTDetails, sanitizeText, sleep } from "../utils";
import crypto from "crypto";
import { Attribute } from "../entities/Attribute";
import { AttributeProperty } from "../entities/AttributeProperty";
import { AttributePropNFTMapping } from "../entities/AttributePropNFTMapping";

const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

export class NFT {
  private contract: ContractEntity;
  private tokenId: number | string;
  private alchemy: any;

  constructor({
    contract,
    tokenId,
    alchemy,
  }: {
    contract: ContractEntity;
    tokenId: number | string;
    alchemy: any;
  }) {
    this.contract = contract;
    this.tokenId = tokenId;
    this.alchemy = alchemy;
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
    attributesData: any
  ) {
    if (!nft) return;

    const attributeRepo = getRepository(Attribute);
    const attributePropertyRepo = getRepository(AttributeProperty);
    const attributePropNFTMappingRepo = getRepository(AttributePropNFTMapping);
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
          },
        });

        if (!attributeProperty) {
          try {
            attributeProperty = new AttributeProperty();
            attributeProperty.value = attributeData.value;
            attributeProperty.attribute = attribute;

            await attributePropertyRepo.save(attributeProperty);
          } catch (error: any) {
            if (error.code === "23505") {
              // Duplicate key error
              attributeProperty = await attributePropertyRepo.findOne({
                where: {
                  value: attributeData.value,
                  attribute,
                },
              });
              if (!attributeProperty)
                throw `Failed to find or save attribute property`;
            } else {
              throw error;
            }
          }
        }

        const existingMappingId = await attributePropNFTMappingRepo.findOne({
          where: {
            property: attributeProperty,
            nft,
          },
        });

        if (!existingMappingId) {
          try {
            await attributePropNFTMappingRepo.save({
              property: attributeProperty,
              nft,
            });
          } catch (error: any) {
            if (error.code !== "23505") {
              throw error;
            }
          }
        }
      }
    } catch (e) {
      throw e;
    }
  }

  async createNFTAndAttributes(nftData: any) {
    try {
      const truncateTitle = (title: string) =>
        title.length > 500 ? title.slice(0, 500) : title;

      const saveData = {
        ...nftData,
        isAttributeUpdated: false,
        title: sanitizeText(truncateTitle(nftData.title || "")) || "",
        description: sanitizeText(nftData.description || "") || "",
        contract: this.contract,
        attributesRaw: sanitizeText(nftData.attributesRaw || "") || "",
        imageRaw: sanitizeText(nftData.imageUri || "") || "",
      };

      const nft = await getRepository(NFTEntity).save(saveData);

      if (!this.contract.description) {
        await getRepository(Contract).update(
          { id: this.contract.id },
          { description: sanitizeText(nftData.description || "") }
        );
      }

      await this.saveAttributes(nft, this.contract, nftData.attribute);

      if (nft.imageRaw) {
        axios
          .post(
            "http://119.194.12.150/image/",
            { nftId: nft.id },
            { timeout: 600000 * 6 } // 타임아웃을 1시간으로 설정
          )
          .catch((e) => {
            console.error(e.message);
          });
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
      const { isSuccess, nftDetail, message } = await getNFTDetails(
        this.contract.address,
        this.tokenId,
        this.alchemy
      );

      nftData = nftDetail;

      if (!isSuccess) {
        nftData.errorMessage = message;
      }

      try {
        nft = await this.createNFTAndAttributes(nftData);
        await getRepository(NFTEntity).update(
          { id: nft?.id },
          { isUpdatedComplete: true }
        );
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
    }
  }
}
