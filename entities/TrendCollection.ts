import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './Contract';

const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

export enum TimeRange {
  ONE_HOUR = '1H',
  SIX_HOURS = '6H',
  TWELVE_HOURS = '12H',
  TWENTY_FOUR_HOURS = '24H',
}

const example: any = {
  id: 1,
  contract: isNestJs ? Contract.example() : {},
  floorPrice: 0.945,
  volume: 45.3,
  timeRange: TimeRange.ONE_HOUR,
  sales: 35,
  staticCreateAt: new Date(),
  createAt: new Date(),
  updateAt: new Date(),
};

const { id, contract, floorPrice, volume, timeRange, sales, staticCreateAt } =
  example;

@Entity({ name: 'trendCollection' })
export class TrendCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.trendCollections)
  @JoinColumn({ name: 'contractId', referencedColumnName: 'id' })
  contract: Contract;

  @Column({ nullable: true, type: 'float' })
  floorPrice: number;

  @Column({ nullable: true, type: 'float' })
  volume: number;

  @Column({ type: 'enum', enum: TimeRange })
  timeRange: TimeRange;

  @Column({ nullable: true })
  sales: number;

  @Column({ type: Date, default: () => 'CURRENT_TIMESTAMP' })
  staticCreateAt: Date;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;

  static example(): TrendCollection {
    const instance: any = new TrendCollection();

    for (let key in example) {
      instance[key] = example[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const propertyDecorators = [
    ApiProperty({
      type: Contract,
      example: contract,
      description: 'Contract',
    }),
    ApiProperty({
      type: Number,
      example: floorPrice,
      description: '오픈시 바닥가격',
    }),
    ApiProperty({
      type: Number,
      example: volume,
      description: 'Volume (거래량)',
    }),
    ApiProperty({
      type: String,
      example: timeRange,
      description: '시간대 - 현재시간으로부터 몇시간 전',
    }),
    ApiProperty({
      type: Number,
      example: sales,
      description: '거래갯수',
    }),
    ApiProperty({
      type: Date,
      example: staticCreateAt,
      description: '생성 기준 시간',
    }),
  ];

  propertyDecorators.forEach((decorator, index) => {
    decorator(TrendCollection.prototype, index.toString());
  });
}
