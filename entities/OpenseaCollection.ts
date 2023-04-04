import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./Contract";

@Entity({ name: "openseaCollection" })
export class OpenseaCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Contract, (contract) => contract.openseaCollection, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true, length: 4000 })
  bannerImageUrl: string;

  @Column({ nullable: true })
  createdDate: Date;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true, length: 4000 })
  imageUrl: string;

  @Column({ nullable: true })
  largeImageUrl: string;

  @Column({ nullable: true })
  mediumUsername: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  shortDescription: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  telegramUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  instagramUsername: string;

  @Column({ nullable: true })
  wikiUrl: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
