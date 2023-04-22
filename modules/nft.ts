import { getConnection, getRepository, QueryRunner } from "typeorm";
import { Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { alchemy } from "../blockEventHandler";
import axios, { AxiosResponse } from "axios";
import { sleep } from "../utils";
import { OpenseaNFT } from "../entities/OpenseaNFT";
import { CreateEntityData } from "./manufactureData";

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
          });

          // const openseaNFT = await this.handleOpenseaNFT(
          //   this.contract.address,
          //   this.tokenId
          // );

          // if (openseaNFT?.data?.tokenId) {
          //   const createEntityData = new CreateEntityData({
          //     snakeObject: openseaNFT?.data,
          //     entity: OpenseaNFT,
          //     filterList: ["id"],
          //   });

          //   await this.queryRunner.manager.save(OpenseaNFT, {
          //     nft,
          //     ...createEntityData.createTableRowData(),
          //   });
          // }
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
