import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  Index,
  AfterLoad,
} from "typeorm";
import { Action } from "../modules/decodeLog";
import { Log } from "./Log";
import { Transaction } from "./Transaction";
import { Contract } from "./Contract";
import { NFT } from "./NFT";
import * as dotenv from "dotenv";
import { decodedLogExample } from "../entityExamples";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "decodedLog" })
@Index("idx_decodedlog_contractaddress_timestamp", [
  "contractAddress",
  "timestamp",
])
@Index("idx_decodedlog_transaction", ["transaction"])
@Index("idx_decodedlog_log", ["log"])
@Index("idx_decodedlog_nft", ["nft"])
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
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @ManyToOne(() => NFT, (nft) => nft.logs, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "nftId", referencedColumnName: "id" })
  nft: NFT;

  @Column({ nullable: true })
  action: Action;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  from: string;

  @Column({ nullable: true })
  to: string;

  @Column({ nullable: true, type: "float" })
  ethValue: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true, type: "float" })
  value: number;

  @Column({ nullable: true })
  platform: string;

  @Column({ nullable: true })
  quantity: string;

  @Column({ nullable: true })
  minterAddress: string;

  @Column({ nullable: true })
  stage: string;

  @Column({ nullable: true })
  mintCount: number;

  @Column({ nullable: true })
  timestamp: number;

  @Column({ nullable: true })
  eventTime: Date;

  @Column({ nullable: true })
  gasUsed: string;

  @Column({ nullable: true })
  cumulativeGasUsed: string;

  @Column({ nullable: true })
  effectiveGasPrice: string;

  @Column({ nullable: true })
  gasPrice: string;

  @Column({ nullable: true })
  gasLimit: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  transactionFee: string;
  @AfterLoad()
  convertGasPrice() {
    if (this.gasPrice && this.effectiveGasPrice) {
      const fee =
        (parseFloat(this.effectiveGasPrice) * parseFloat(this.gasUsed)) /
        Math.pow(10, 18);
      this.transactionFee = fee.toFixed(4);
    }
  }

  static example(): DecodedLog {
    const instance: any = new DecodedLog();

    for (let key in decodedLogExample) {
      instance[key] = decodedLogExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    log,
    transaction,
    contract,
    nft,
    action,
    contractAddress,
    tokenId,
    from,
    to,
    ethValue,
    unit,
    value,
    platform,
    quantity,
    minterAddress,
    stage,
    mintCount,
    timestamp,
    eventTime,
    gasUsed,
    cumulativeGasUsed,
    effectiveGasPrice,
    gasPrice,
    gasLimit,
    createdAt,
    updatedAt,
    transactionFee,
  } = decodedLogExample;

  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "log",
      type: () => Log,
      example: log,
      description: "로그 데이터",
    }),

    ApiProperty({
      name: "transaction",
      type: () => Transaction,
      example: transaction,
      description: "트랜잭션 데이터",
    }),
    ApiProperty({
      name: "contract",
      type: () => Contract,
      example: contract,
      description: "컨트랙트 데이터",
    }),
    ApiProperty({
      name: "nft",
      type: () => NFT,
      example: nft,
      description: "NFT 데이터",
    }),

    ApiProperty({
      name: "action",
      type: String,
      example: action,
      description: "액션(Sale | Transfer | Mint)",
    }),

    ApiProperty({
      name: "contractAddress",
      type: String,
      example: contractAddress,
      description: "컬랙션 주소",
    }),

    ApiProperty({
      name: "tokenId",
      type: String,
      example: tokenId,
      description: "토큰 아이디",
    }),

    ApiProperty({
      name: "from",
      type: String,
      example: from,
      description: "From 주소",
    }),

    ApiProperty({
      name: "to",
      type: String,
      example: to,
      description: "To 주소",
    }),

    ApiProperty({
      name: "ethValue",
      type: String,
      example: ethValue,
      description: "가격(ETH)",
    }),
    ApiProperty({
      name: "unit",
      type: String,
      example: unit,
      description: "단위",
    }),
    ApiProperty({
      name: "value",
      type: String,
      example: value,
      description: "가격(ETH)",
    }),

    ApiProperty({
      name: "platform",
      type: String,
      example: platform,
      description: "마켓 플래이스",
    }),

    ApiProperty({
      name: "quantity",
      type: Number,
      example: quantity,
      description: "수량",
    }),

    ApiProperty({
      name: "minterAddress",
      type: String,
      example: minterAddress,
      description: "minterAddress",
    }),

    ApiProperty({
      name: "stage",
      type: String,
      example: stage,
      description: "stage",
    }),

    ApiProperty({
      name: "mintCount",
      type: Number,
      example: mintCount,
      description: "민팅 갯수",
    }),

    ApiProperty({
      name: "timestamp",
      type: Number,
      example: timestamp,
      description: "이벤트 타임스탬프",
    }),

    ApiProperty({
      name: "eventTime",
      type: Date,
      example: eventTime,
      description: "이벤트 타임",
    }),

    ApiProperty({
      name: "gasUsed",
      type: String,
      example: gasUsed,
      description: "gasUsed",
    }),
    ApiProperty({
      name: "cumulativeGasUsed",
      type: String,
      example: cumulativeGasUsed,
      description: "cumulativeGasUsed",
    }),
    ApiProperty({
      name: "effectiveGasPrice",
      type: String,
      example: effectiveGasPrice,
      description: "effectiveGasPrice",
    }),
    ApiProperty({
      name: "gasPrice",
      type: String,
      example: gasPrice,
      description: "gasPrice",
    }),
    ApiProperty({
      name: "gasLimit",
      type: String,
      example: gasLimit,
      description: "gasLimit",
    }),
    ApiProperty({
      name: "transactionFee",
      type: String,
      example: transactionFee,
      description: "transactionFee",
    }),
    ApiProperty({
      name: "gasPrice",
      type: String,
      example: gasPrice,
      description: "gasPrice",
    }),
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
    decorator(DecodedLog.prototype, index.toString());
  });
}
