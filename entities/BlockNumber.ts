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

  @Column({ nullable: false, unique: true })
  blockNumber: number;

  @OneToMany(() => Transaction, (transaction) => transaction.blockNumber, {
    onDelete: "CASCADE",
  })
  transactions: Transaction[];

  @Column({ nullable: false, default: false })
  isCompletedUpdate: boolean;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
