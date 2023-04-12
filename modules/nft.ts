import { getRepository, QueryRunner } from "typeorm";
import { Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { alchemy } from "../blockEventHandler";

export class NFT {
  private contract: ContractEntity;
  private queryRunner: QueryRunner;
  private tokenId: number | string;

  constructor({
    contract,
    queryRunner,
    tokenId,
  }: {
    contract: ContractEntity;
    queryRunner: QueryRunner;
    tokenId: number | string;
  }) {
    this.contract = contract;
    this.queryRunner = queryRunner;
    this.tokenId = tokenId;
  }

  async saveNFT() {
    try {
      // let nft = await this.queryRunner.manager.findOne(NFTEntity, {
      //   where: {
      //     contract: this.contract,
      //     tokenId: this.tokenId,
      //   },
      // });

      let nft = await getRepository(NFTEntity).findOne({
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
          // nft = await this.queryRunner.manager.save(NFTEntity, {
          //   ...nftData,
          //   mediaThumbnail: nftData?.media?.[0]?.thumbnail,
          //   contract: this.contract,
          // });

          nft = await getRepository(NFTEntity).save({
            ...nftData,
            mediaThumbnail: nftData?.media?.[0]?.thumbnail,
            contract: this.contract,
          });
        } catch (e: any) {
          if (e.code === "23505") {
            // nft = await this.queryRunner.manager.findOne(NFTEntity, {
            //   where: {
            //     contract: this.contract,
            //     tokenId: this.tokenId,
            //   },
            // });
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
        throw new Error(`Failed to find or save nft`);
      }
      return nft;
    } catch (e: any) {
      throw new Error(e);
    }
  }
}
