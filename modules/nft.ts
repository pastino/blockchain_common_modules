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
import { IS_PRODUCTION } from "../..";

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

    for (const attributeData of attributesData) {
      // TraitType이 이미 생성되었는지 확인 후, 없으면 생성
      let traitType = await traitTypeRepo.findOne({
        traitType: attributeData.trait_type,
      });
      if (!traitType) {
        traitType = new TraitType();
        traitType.traitType = attributeData.trait_type;
        traitType = await traitTypeRepo.save(traitType);
      }

      // TraitTypeContract이 이미 생성되었는지 확인 후, 없으면 생성
      let traitTypeContract = await traitTypeContractRepo.findOne({
        traitType,
        contract,
      });
      if (!traitTypeContract) {
        traitTypeContract = new TraitTypeContract();
        traitTypeContract.traitType = traitType;
        traitTypeContract.contract = contract;
        traitTypeContract = await traitTypeContractRepo.save(traitTypeContract);
      }

      // Attribute이 이미 생성되었는지 확인 후, 없으면 생성
      let attribute = await attributeRepo.findOne({
        value: attributeData.value,
        traitType,
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
  }

  async saveNFT() {
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();

    try {
      let nft = await this.queryRunner.manager.findOne(NFTEntity, {
        where: {
          contract: this.contract,
          tokenId: this.tokenId,
        },
      });

      if (!nft) {
        const nftData = await alchemy.nft.getNftMetadata(
          this.contract.address,
          this.tokenId
        );

        try {
          nft = await this.queryRunner.manager.save(NFTEntity, {
            ...nftData,
            mediaThumbnail: nftData?.media?.[0]?.thumbnail,
            contract: this.contract,
            attributesRaw: nftData.tokenUri?.raw,
            rawMetadataImage: nftData.rawMetadata?.image,
            imageRaw: nftData.rawMetadata?.image,
            imageFormat: nftData.media?.[0]?.format,
            imageBytes: nftData.media?.[0]?.bytes,
          });

          if (
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
          // NFT 이미지 생성
          try {
            if (IS_PRODUCTION)
              await axios.post("http://121.168.75.64/image", {
                contractAddress: this.contract.address,
                imageUrl: nftData.rawMetadata?.image,
                tokenId: this.tokenId,
                format: nftData.media?.[0]?.format,
              });
          } catch (e) {
            null;
          }
        } catch (e: any) {
          if (e.code === "ER_DUP_ENTRY") {
            nft = await getRepository(NFTEntity).findOne({
              where: {
                contract: this.contract,
                tokenId: this.tokenId,
              },
            });
          } else {
            console.error("Unexpected error:", e);
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
    }
  }
}
