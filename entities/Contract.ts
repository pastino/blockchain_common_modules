import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
} from "typeorm";
import { NFT } from "./NFT";
import { Transfer } from "./Transfer";
import { TrendCollection } from "./TrendCollection";

const isNestJs = process.env.APP_TYPE === "nestjs";

const example: any = {
  id: 1,
  address: "0xd774557b647330c91bf44cfeab205095f7e6c367",
  tokenId: "",
  name: "Nakamigos",
  totalSupply: "20000",
  isSpam: "",
  imageUrl:
    "https://i.seadn.io/gcs/files/beabfabb47c6baeb6008f21bc0681986.jpg?w=500&auto=format",
  description: "",
  externalUrl: "https://www.0xhoneyjar.xyz/",
  twitterUsername: "",
  discordUrl: "",
  symbol: "HONEYCOMB",
  tokenType: "ERC721",
  contractDeployer: "0xf951ba8107d7bf63733188e64d7e07bd27b46af7",
  deployedBlockNumber: "16751283",
  isCompletedInitialUpdate: true,
  isCompletedUpdate: true,
  createAt: new Date(),
  updateAt: new Date(),
};

@Entity({ name: "contract" })
// @Unique(["address"])
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  totalSupply: string;

  @Column({ nullable: true })
  isSpam: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true })
  contractDeployer: string;

  @Column({ nullable: true })
  deployedBlockNumber: number;

  @Column({ default: false })
  isCompletedInitialUpdate: boolean;

  @Column({ default: true })
  isCompletedUpdate: boolean;

  @OneToMany(() => NFT, (nft) => nft.contract, {
    onDelete: "CASCADE",
  })
  nfts: NFT[];

  @OneToMany(() => Transfer, (transfer) => transfer.contract, {
    onDelete: "CASCADE",
  })
  transfers: Transfer[];

  @OneToMany(
    () => TrendCollection,
    (trendCollection) => trendCollection.contract,
    {
      onDelete: "CASCADE",
    }
  )
  trendCollections: TrendCollection[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;

  static example(): Contract {
    const instance: any = new Contract();

    for (let key in example) {
      instance[key] = example[key];
    }

    return instance;
  }
}
