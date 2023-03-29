import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { WalletContractConnection } from "./WalletContractConnection";

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  profileImgUrl: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(
    () => WalletContractConnection,
    (walletContractConnection) => walletContractConnection.walletId,
    {
      onDelete: "CASCADE",
    }
  )
  walletContract: WalletContractConnection[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
