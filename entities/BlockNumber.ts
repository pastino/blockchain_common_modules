import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Transaction } from "./Transaction";
import * as dotenv from "dotenv";
import { blockNumberExample } from "../entityExamples";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

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
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): BlockNumber {
    const instance: any = new BlockNumber();

    for (let key in blockNumberExample) {
      instance[key] = blockNumberExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    blockNumber,
    transactions,
    isCompletedUpdate,
    createdAt,
    updatedAt,
  } = blockNumberExample;

  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "blockNumber",
      type: Number,
      example: blockNumber,
      description: "블록 넘버",
    }),
    ApiProperty({
      name: "transactions",
      type: [Transaction],
      example: transactions,
      description: "트랜잭션",
    }),
    ApiProperty({
      name: "isCompletedUpdate",
      type: Boolean,
      example: isCompletedUpdate,
      description: "업데이트 완료 여부",
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
    decorator(BlockNumber.prototype, index.toString());
  });
}
