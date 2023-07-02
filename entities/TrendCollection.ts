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
import * as dotenv from "dotenv";
import { contractExample } from "../entityExamples";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

export enum TimeRange {
  ONE_HOUR = "1H",
  SIX_HOURS = "6H",
  TWELVE_HOURS = "12H",
  TWENTY_FOUR_HOURS = "24H",
}

export const trandCollectionExample: any = {
  id: 1,
  contract: isNestJs ? contractExample : {},
  floorPrice: 0.945,
  volume: 45.3,
  timeRange: TimeRange.ONE_HOUR,
  sales: 35,
  staticCreateAt: new Date(),
  createAt: new Date(),
  updateAt: new Date(),
};

const {
  id,
  contract,
  floorPrice,
  volume,
  timeRange,
  sales,
  staticCreateAt,
  createdAt,
  updatedAt,
} = trandCollectionExample;

@Entity({ name: "trendCollection" })
export class TrendCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.trendCollections)
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true, type: "float" })
  floorPrice: number;

  @Column({ nullable: true, type: "float" })
  volume: number;

  @Column({ type: "enum", enum: TimeRange })
  timeRange: TimeRange;

  @Column({ nullable: true })
  sales: number;

  @Column({ nullable: true })
  averageValue: number;

  @Column({ nullable: true })
  priceDeviation: number;

  @Column({ nullable: true })
  priceDeviationPercent: number;

  @Column({ type: Date, default: () => "CURRENT_TIMESTAMP" })
  staticCreateAt: Date;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): TrendCollection {
    const instance: any = new TrendCollection();

    for (let key in trandCollectionExample) {
      instance[key] = trandCollectionExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "contract",
      type: () => Contract,
      example: contract,
      description: "Contract",
    }),
    ApiProperty({
      name: "floorPrice",
      type: Number,
      example: floorPrice,
      description: "오픈시 바닥가격",
    }),
    ApiProperty({
      name: "volume",
      type: Number,
      example: volume,
      description: "Volume (거래량)",
    }),
    ApiProperty({
      name: "timeRange",
      type: TimeRange,
      enum: TimeRange,
      example: timeRange,
      description: "시간대 - 현재시간으로부터 몇시간 전",
    }),
    ApiProperty({
      name: "sales",
      type: Number,
      example: sales,
      description: "거래갯수",
    }),
    ApiProperty({
      name: "staticCreateAt",
      type: Date,
      example: staticCreateAt,
      description: "생성 기준 시간",
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
    decorator(TrendCollection.prototype, index.toString());
  });
}
