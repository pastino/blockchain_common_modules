import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { NFT } from "./NFT";
import { Transfer } from "./Transfer";
import { TrendCollection } from "./TrendCollection";

@Entity({ name: "contract" })
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
}
