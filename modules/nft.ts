import { QueryRunner } from "typeorm";
import { Contract as ContractEntity } from "../entities/Contract";
import { NFT as NFTEntity } from "../entities/NFT";
import { alchemy } from "../blockEventHandler";

export class NFT {
  private contract: ContractEntity;
  private queryRunner: QueryRunner;
  private tokenId: number;

  constructor({
    contract,
    queryRunner,
    tokenId,
  }: {
    contract: ContractEntity;
    queryRunner: QueryRunner;
    tokenId: number;
  }) {
    this.contract = contract;
    this.queryRunner = queryRunner;
    this.tokenId = tokenId;
  }

  async saveNFT() {
    try {
      console.log(1);
      let nft = await this.queryRunner.manager.findOne(NFTEntity, {
        where: {
          contract: this.contract,
          tokenId: this.tokenId,
        },
      });
      console.log(2);
      if (!nft) {
        console.log(3, this.contract.address, this.tokenId);
        const nftData = await alchemy.nft.getNftMetadata(
          this.contract.address,
          this.tokenId
        );
        console.log(4);
        try {
          nft = await this.queryRunner.manager.save(NFTEntity, {
            ...nftData,
            mediaThumbnail: nftData?.media?.[0]?.thumbnail,
            contract: this.contract,
          });
          console.log(5);
        } catch (e: any) {
          if (e.code === "23505") {
            nft = await this.queryRunner.manager.findOne(NFTEntity, {
              where: {
                contract: this.contract,
                tokenId: this.tokenId,
              },
            });
            console.log(6);
          } else {
            console.error("Unexpected error:", e);
          }
          console.log(7);
        }
      }
      console.log(8);
      if (!nft) {
        throw new Error(`Failed to find or save nft`);
      }
      return nft;
    } catch (e: any) {
      throw new Error(e);
    }
  }
}
