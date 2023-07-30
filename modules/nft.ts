import { getConnection, getRepository, QueryRunner } from "typeorm";
import { Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { alchemy } from "../blockEventHandler";
import axios, { AxiosResponse } from "axios";
import { sleep } from "../utils";
import crypto from "crypto";
import { TraitType } from "../entities/TraitType";
import { AttributeNFT } from "../entities/AttributeNFT";
import { TraitTypeContract } from "../entities/TraitTypeContract";
import { Attribute } from "../entities/Attribute";

const openSeaConfig: any = {
  headers: {
    "X-API-KEY": process.env.OPENSEA_API_KEY,
  },
};

export class NFT {
  private contract: ContractEntity;
  private tokenId: number | string;
  private queryRunner: QueryRunner;

  constructor({
    contract,
    tokenId,
  }: {
    contract: ContractEntity;
    tokenId: number | string;
  }) {
    this.contract = contract;
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    this.queryRunner = queryRunner;
    this.tokenId = tokenId;
  }

  async handleOpenseaNFT(
    contractAddress: string,
    tokenId: string | number,
    retryCount: number = 10
  ): Promise<AxiosResponse | undefined> {
    try {
      console.log(contractAddress, tokenId);
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
    attributesData: any[],
    queryRunner: QueryRunner
  ) {
    const traitTypeRepo = queryRunner.manager.getRepository(TraitType);
    const attributeRepo = queryRunner.manager.getRepository(Attribute);
    const attributeNFTRepo = queryRunner.manager.getRepository(AttributeNFT);
    const traitTypeContractRepo =
      queryRunner.manager.getRepository(TraitTypeContract);

    try {
      for (const attributeData of attributesData) {
        if (
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
      const nft = await this.queryRunner.manager.save(NFTEntity, {
        ...nftData,
        isAttributeUpdated: true,
        mediaThumbnail: nftData?.media?.[0]?.thumbnail,
        title:
          nftData.title.length > 500
            ? nftData.title.slice(0, 500)
            : nftData.title,
        contract: this.contract,
        attributesRaw:
          typeof nftData.tokenUri?.raw === "string" ? nftData.tokenUri.raw : "",
        rawMetadataImage:
          typeof nftData.media?.[0]?.raw === "string"
            ? nftData.media?.[0]?.raw
            : "",
        imageRaw:
          typeof nftData.media?.[0]?.raw === "string"
            ? nftData.media?.[0]?.raw
            : "",
        imageFormat:
          typeof nftData.media?.[0]?.format === "string"
            ? nftData.media[0].format
            : "",
        imageBytes:
          typeof nftData.media?.[0]?.bytes === "number"
            ? nftData.media?.[0]?.bytes
            : 0,
      });

      if (
        nft &&
        nftData.rawMetadata?.attributes &&
        nftData.rawMetadata?.attributes.length > 0
      ) {
        await this.saveAttributes(
          nft,
          this.contract,
          nftData.rawMetadata?.attributes,
          this.queryRunner
        );
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
      axios.post(
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
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    let nft = await this.queryRunner.manager.findOne(NFTEntity, {
      where: {
        contract: this.contract as any,
        tokenId: this.tokenId as any,
      },
    });

    try {
      if (!nft) {
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
      }
      if (!nft) {
        throw `Failed to find or save nft`;
      }
      await this.queryRunner.commitTransaction();
      return nft;
    } catch (e: any) {
      await this.queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await this.queryRunner.release();
      // NFT 이미지 생성 api/
      try {
        this.createImage({
          nftId: nft?.id as number,
          contractAddress: this.contract.address,
          imageUrl: nftData.rawMetadata?.image,
          tokenId: this.tokenId,
          format: nftData.media?.[0]?.format,
        });
      } catch (e) {
        null;
      }
    }
  }

  async saveNFT() {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    let nftData: any;
    let nft = await this.queryRunner.manager.findOne(NFTEntity, {
      where: {
        contract: this.contract as any,
        tokenId: this.tokenId as any,
      },
    });

    try {
      if (!nft) {
        nftData = await alchemy.nft.getNftMetadata(
          this.contract.address,
          this.tokenId
        );

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
      }
      if (!nft) {
        throw `Failed to find or save nft`;
      }
      await this.queryRunner.commitTransaction();
      return nft;
    } catch (e: any) {
      await this.queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await this.queryRunner.release();
      // NFT 이미지 생성 api/
      try {
        this.createImage({
          nftId: nft?.id as number,
          contractAddress: this.contract.address,
          imageUrl: nftData.rawMetadata?.image,
          tokenId: this.tokenId,
          format: nftData.media?.[0]?.format,
        });
      } catch (e) {
        null;
      }
    }
  }
}
