import { ApiProperty } from '@nestjs/swagger';
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

export enum TimeRange {
  ONE_HOUR = '1H',
  SIX_HOURS = '6H',
  TWELVE_HOURS = '12H',
  TWENTY_FOUR_HOURS = '24H',
}

const example = {
  id: 1,
  contract: Contract.example(),
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
  @ApiProperty({
    type: Number,
    example: id,
    description: 'Uniqe ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    type: Contract,
    example: contract,
    description: 'Contract',
  })
  @ManyToOne(() => Contract, (contract) => contract.trendCollections)
  @JoinColumn({ name: 'contractId', referencedColumnName: 'id' })
  contract: Contract;

  @ApiProperty({
    type: Number,
    example: floorPrice,
    description: '오픈시 바닥가격',
  })
  @Column({ nullable: true })
  floorPrice: number;

  @ApiProperty({
    type: Number,
    example: volume,
    description: 'Volume (거래량)',
  })
  @Column({ nullable: true })
  volume: number;

  @ApiProperty({
    type: String,
    example: timeRange,
    description: '시간대 - 현재시간으로부터 몇시간 전',
  })
  @Column({ type: 'enum', enum: TimeRange })
  timeRange: TimeRange;

  @ApiProperty({
    type: Number,
    example: sales,
    description: '거래갯수',
  })
  @Column({ nullable: true })
  sales: number;

  @ApiProperty({
    type: Date,
    example: staticCreateAt,
    description: '생성 기준 시간',
  })
  @Column({ type: Date, default: () => 'CURRENT_TIMESTAMP' })
  staticCreateAt: Date;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;

  static example(): TrendCollection {
    const instance = new TrendCollection();

    for (let key in example) {
      instance[key] = example[key];
    }

    return instance;
  }
}
