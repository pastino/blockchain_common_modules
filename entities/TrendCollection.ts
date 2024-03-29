import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
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
  SEVEN_DAYS = "7D",
}

export const trandCollectionExample: any = {
  id: 1,
  contract: isNestJs ? contractExample : {},
  floorPrice: 0.945,
  volume: 45.3,
  timeRange: TimeRange.ONE_HOUR,
  sales: 35,
  volumeDeviation: 0.01,
  volumeDeviationPercent: 58,
  salesDeviation: 0.01,
  salesDeviationPercent: 58,
  averageValue: 0.034,
  priceDeviation: 0.01,
  priceDeviationPercent: 58,
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
  volumeDeviation,
  volumeDeviationPercent,
  salesDeviation,
  salesDeviationPercent,
  averageValue,
  priceDeviation,
  priceDeviationPercent,
  staticCreateAt,
  createdAt,
  updatedAt,
} = trandCollectionExample;

@Entity({ name: "trendCollection" })
@Index("idx_trend_time_static", ["timeRange", "staticCreateAt"])
export class TrendCollection {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.trendCollections, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true, type: "float" })
  floorPrice: number;

  @Column({ type: "enum", enum: TimeRange })
  timeRange: TimeRange;

  @Column({ nullable: true })
  sales: number;

  @Column({ nullable: true, type: "float" })
  salesDeviation: number;

  @Column({ nullable: true, type: "float" })
  salesDeviationPercent: number;

  @Column({ nullable: true, type: "float" })
  volume: number;

  @Column({ nullable: true, type: "float" })
  volumeDeviation: number;

  @Column({ nullable: true, type: "float" })
  volumeDeviationPercent: number;

  @Column({ nullable: true, type: "float" })
  averageValue: number;

  @Column({ nullable: true, type: "float" })
  priceDeviation: number;

  @Column({ nullable: true, type: "float" })
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
      name: "volumeDeviation",
      type: Number,
      example: volumeDeviation,
      description: "볼륨차이",
    }),
    ApiProperty({
      name: "volumeDeviationPercent",
      type: Number,
      example: volumeDeviationPercent,
      description: "볼륨차이 퍼센트",
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
      name: "salesDeviation",
      type: Number,
      example: salesDeviation,
      description: "판매차이",
    }),
    ApiProperty({
      name: "salesDeviationPercent",
      type: Number,
      example: salesDeviationPercent,
      description: "판매차이 퍼센트",
    }),

    ApiProperty({
      name: "averageValue",
      type: Number,
      example: averageValue,
      description: "평균가격",
    }),
    ApiProperty({
      name: "priceDeviation",
      type: Number,
      example: priceDeviation,
      description: "가격차이",
    }),
    ApiProperty({
      name: "priceDeviationPercent",
      type: Number,
      example: priceDeviationPercent,
      description: "가격차이 퍼센트",
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
