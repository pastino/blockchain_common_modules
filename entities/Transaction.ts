import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToOne,
} from "typeorm";
import { BlockNumber } from "./BlockNumber";
import { Transfer } from "./Transfer";

@Entity({ name: "transaction" })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  hash: string;

  @OneToOne(() => Transfer, (transfer) => transfer.transaction, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transferId", referencedColumnName: "id" })
  transfer: Transfer;

  @Column({ nullable: true })
  timestamp: number;

  @Column({ nullable: true })
  eventTime: Date;

  @Column({ nullable: true })
  blockHash: string;

  @ManyToOne(() => BlockNumber, (blockNumber) => blockNumber.transactions)
  @JoinColumn({ name: "blockNumber", referencedColumnName: "id" })
  blockNumber: number;

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

  @Column({ nullable: true, unique: true })
  logId: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
