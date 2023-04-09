import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { BlockNumber } from "./BlockNumber";
import { Contract } from "./Contract";
import { Log } from "./Log";

@Entity({ name: "transaction" })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  hash: string;

  @Column({ nullable: true })
  timestamp: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts)
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true })
  eventTime: Date;

  @Column({ nullable: true })
  blockHash: string;

  @ManyToOne(() => BlockNumber, (blockNumber) => blockNumber.transactions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "blockNumberId", referencedColumnName: "id" })
  blockNumber: BlockNumber;

  @Column({ nullable: true })
  transactionIndex: number;

  @Column({ nullable: true })
  confirmations: number;

  @Column({ nullable: true })
  to: string;

  @Column({ nullable: true })
  from: string;

  @Column({ nullable: true })
  gasPrice: string;

  @Column({ nullable: true })
  gasLimit: string;

  @Column({ nullable: true })
  value: string;

  @Column({ nullable: true })
  nonce: number;

  @Column({ type: "longtext", nullable: true })
  data: string;

  @Column({ nullable: true })
  chainId: number;

  @OneToMany(() => Log, (log) => log.transaction, {
    onDelete: "CASCADE",
  })
  logs: Log[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
