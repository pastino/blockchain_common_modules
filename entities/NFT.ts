import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from "typeorm";
import { Contract } from "./Contract";
import { Log } from "./Log";
import { Transfer } from "./Transfer";

@Entity({ name: "nft" })
@Unique("uniqueIndex", ["contract", "tokenId"])
export class NFT {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts)
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true, length: 1000 })
  title: string;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  mediaThumbnail: string;

  @Column({ nullable: true })
  rawMetadataImage: string;

  @OneToMany(() => Transfer, (transfer) => transfer.nft)
  transfers: Transfer[];

  @OneToMany(() => Log, (log) => log.nft, {
    onDelete: "SET NULL",
  })
  logs: Log[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
