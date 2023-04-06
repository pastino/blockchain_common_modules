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
