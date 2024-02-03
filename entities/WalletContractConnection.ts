import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./Contract";
import { Wallet } from "./Wallet";

@Entity({ name: "walletContractConnection" })
export class WalletContractConnection {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ type: "int" })
  @ManyToOne(() => Wallet, (wallet) => wallet.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "walletId", referencedColumnName: "id" })
  walletId: number;

  @Column({ type: "int" })
  @ManyToOne(() => Contract, (contract) => contract.id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contractId: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
