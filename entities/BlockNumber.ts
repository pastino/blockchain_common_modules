import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Transaction } from "./Transaction";

@Entity({ name: "blockNumber" })
export class BlockNumber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  blockNumber: number;

  @OneToMany(() => Transaction, (transaction) => transaction.blockNumber, {
    onDelete: "CASCADE",
  })
  transactions: Transaction[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
