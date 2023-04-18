import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { NFT } from "./NFT";

@Entity({ name: "openseaNFT" })
export class OpenseaNFT {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => NFT, (nft) => nft.openseaNFT, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "nftId", referencedColumnName: "id" })
  nft: NFT;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  numSales: number;

  @Column({ nullable: true })
  backgroundColor: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  imagePreviewUrl: string;

  @Column({ nullable: true })
  imageThumbnailUrl: string;

  @Column({ nullable: true })
  imageOriginalUrl: string;

  @Column({ nullable: true })
  animationUrl: string;

  @Column({ nullable: true })
  animationOriginalUrl: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  externalLink: string;

  @Column({ nullable: true })
  permalink: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
