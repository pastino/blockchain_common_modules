import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
} from "typeorm";
import { Contract } from "./Contract";
import { NFT } from "./NFT";
import { Topic } from "./Topic";
import { Transaction } from "./Transaction";

@Entity({ name: "log" })
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.logs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transactionId", referencedColumnName: "id" })
  transaction: Transaction;

  @ManyToOne(() => Contract, (contract) => contract.nfts, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @ManyToOne(() => NFT, (nft) => nft.logs, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "nftId", referencedColumnName: "id" })
  nft: NFT;

  @Column({ nullable: true })
  transactionIndex: number;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ nullable: true })
  transactionHash: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: "longtext", nullable: true })
  data: string;

  @Column({ nullable: true })
  logIndex: number;

  @Column({ nullable: true })
  blockHash: string;

  @OneToMany(() => Topic, (topic) => topic.log, {
    onDelete: "CASCADE",
  })
  topics: Topic[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
