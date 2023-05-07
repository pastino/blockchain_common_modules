import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Action } from "../modules/decodeLog";
import { Log } from "./Log";
import { Transaction } from "./Transaction";
import { Contract } from "./Contract";
import { NFT } from "./NFT";

@Entity({ name: "decodedLog" })
export class DecodedLog {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Log, (log) => log.decodedLog, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "logId", referencedColumnName: "id" })
  log: Log;

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
  action: Action;

  @Column({ nullable: true })
  contractAddress: String;

  @Column({ nullable: true })
  tokenId: String;

  @Column({ nullable: true })
  from: String;

  @Column({ nullable: true })
  to: String;

  @Column({ nullable: true, type: "float" })
  ethValue: number;

  @Column({ nullable: true })
  unit: String;

  @Column({ nullable: true, type: "float" })
  value: number;

  @Column({ nullable: true })
  platform: String;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  minterAddress: String;

  @Column({ nullable: true })
  stage: String;

  @Column({ nullable: true })
  mintCount: number;

  @Column({ nullable: true })
  timestamp: number;
  @Column({ nullable: true })
  eventTime: Date;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
