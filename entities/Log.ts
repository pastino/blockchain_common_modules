import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Contract } from "./Contract";
import { NFT } from "./NFT";
import { Topic } from "./Topic";
import { Transaction } from "./Transaction";
import * as dotenv from "dotenv";
import { logExample } from "../entityExamples";
import { DecodedLog } from "./DecodedLog";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "log" })
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => DecodedLog, (decodeLog) => decodeLog.log, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "decodedLog", referencedColumnName: "id" })
  decodedLog: DecodedLog;

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
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): Log {
    const instance: any = new Log();

    for (let key in logExample) {
      instance[key] = logExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    transaction,
    contract,
    nft,
    transactionIndex,
    blockNumber,
    transactionHash,
    address,
    data,
    logIndex,
    blockHash,
    topics,
    createdAt,
    updatedAt,
  } = logExample;

  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),

    // transaction
    ApiProperty({
      name: "contract",
      type: Contract,
      example: contract,
      description: "Contract",
    }),
    ApiProperty({
      name: "nft",
      type: NFT,
      example: nft,
      description: "NFT",
    }),
    ApiProperty({
      name: "transactionIndex",
      type: Number,
      example: transactionIndex,
      description: "트랜잭션 인덱스",
    }),
    ApiProperty({
      name: "blockNumber",
      type: Number,
      example: blockNumber,
      description: "블록 넘버",
    }),
    ApiProperty({
      name: "transactionHash",
      type: String,
      example: transactionHash,
      description: "트랜잭션 해시",
    }),
    ApiProperty({
      name: "address",
      type: String,
      example: address,
      description: "주소",
    }),
    ApiProperty({
      name: "data",
      type: String,
      example: data,
      description: "데이터",
    }),
    ApiProperty({
      name: "logIndex",
      type: Number,
      example: logIndex,
      description: "로그 인덱스",
    }),
    ApiProperty({
      name: "blockHash",
      type: String,
      example: blockHash,
      description: "블록 해시",
    }),

    // topics

    ApiProperty({
      name: "createdAt",
      type: Date,
      example: createdAt,
      description: "생성된 시간",
    }),
    ApiProperty({
      name: "updatedAt",
      type: Date,
      example: updatedAt,
      description: "업데이트된 시간",
    }),
  ];

  propertyDecorators.forEach((decorator, index) => {
    decorator(Log.prototype, index.toString());
  });
}
