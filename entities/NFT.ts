import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Contract } from "./Contract";
import { Transfer } from "./Transfer";

@Entity()
export class NFT {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, length: 4000 })
  description: string;

  @Column({ nullable: true })
  mediaThumbnail: string;

  @Column({ nullable: true })
  rawMetadataImage: string;

  @OneToMany(() => Transfer, (transfer) => transfer.nft)
  transfers: Transfer[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
