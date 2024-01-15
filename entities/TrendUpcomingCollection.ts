import * as dotenv from 'dotenv';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { trendUpcomingCollectionExample } from '../entityExamples';
import { UpcomingContract, upcomingContractExample } from './UpcomingContract';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

export enum TimeRange {
  ONE_DAYS = '1D',
  THREE_HOURS = '3D',
  SEVEN_HOURS = '7D',
  FOURTEEN_HOURS = '14D',
}

export const trendUpcomingContractExample: any = {
  id: 1,
  upcomingContract: upcomingContractExample,
  timeRange: TimeRange.ONE_DAYS,
  twitterFollowerCount: 5752,
  twitterBeforeFollowerCount: 5761,
  twitterDeviation: -9.0,
  twitterDeviationPercent: -0.1562228779725742,
  discordJoinCount: 18878,
  discordBeforeJoinCount: 19008,
  discordDeviation: -130.0,
  discordDeviationPercent: -0.6839225589225589,
  staticCreateAt: new Date(),
  createdAt: new Date(2024, 1, 1),
  updatedAt: new Date(2024, 1, 1),
};

@Entity({ name: 'trendUpcomingCollection' })
export class TrendUpcomingCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => UpcomingContract,
    (upcomingContract) => upcomingContract.trendUpcomingCollections,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'upcomingContractId', referencedColumnName: 'id' })
  upcomingContract: UpcomingContract;

  @Column({ type: 'enum', enum: TimeRange })
  timeRange: TimeRange;

  @Column({ nullable: true })
  twitterFollowerCount: number;

  @Column({ nullable: true })
  twitterBeforeFollowerCount: number;

  @Column({ nullable: true, type: 'float' })
  twitterDeviation: number;

  @Column({ nullable: true, type: 'float' })
  twitterDeviationPercent: number;

  @Column({ nullable: true })
  discordJoinCount: number;

  @Column({ nullable: true })
  discordBeforeJoinCount: number;

  @Column({ nullable: true, type: 'float' })
  discordDeviation: number;

  @Column({ nullable: true, type: 'float' })
  discordDeviationPercent: number;

  @Column({ type: Date, default: () => 'CURRENT_TIMESTAMP' })
  staticCreateAt: Date;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): TrendUpcomingCollection {
    const instance: any = new TrendUpcomingCollection();

    for (let key in trendUpcomingCollectionExample) {
      instance[key] = trendUpcomingCollectionExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    upcomingContract,
    timeRange,
    twitterFollowerCount,
    twitterBeforeFollowerCount,
    twitterDeviation,
    twitterDeviationPercent,
    discordJoinCount,
    discordBeforeJoinCount,
    discordDeviation,
    discordDeviationPercent,
    staticCreateAt,
    createdAt,
    updatedAt,
  } = trendUpcomingContractExample;

  const propertyDecorators = [
    ApiProperty({
      name: 'id',
      type: Number,
      example: id,
      description: 'Uniqe ID',
    }),
    ApiProperty({
      name: 'upcomingContract',
      type: () => UpcomingContract,
      example: upcomingContract,
      description: 'Upcoming Contract',
    }),
    ApiProperty({
      name: 'timeRange',
      type: TimeRange,
      enum: TimeRange,
      example: timeRange,
      description: '시간대 - 현재시간으로부터 몇시간 전',
    }),
    ApiProperty({
      name: 'twitterFollowerCount',
      type: Number,
      example: twitterFollowerCount,
      description: '트위터 팔로워 수',
    }),
    ApiProperty({
      name: 'twitterBeforeFollowerCount',
      type: Number,
      example: twitterBeforeFollowerCount,
      description: '트위터 팔로워 수 (기준 시간)',
    }),
    ApiProperty({
      name: 'twitterDeviation',
      type: Number,
      example: twitterDeviation,
      description: '트위터 팔로워 수 변화량',
    }),
    ApiProperty({
      name: 'twitterDeviationPercent',
      type: Number,
      example: twitterDeviationPercent,
      description: "트위터 팔로워 수 변화량 퍼센트 ('%' 제외)",
    }),
    ApiProperty({
      name: 'discordJoinCount',
      type: Number,
      example: discordJoinCount,
      description: '디스코드 가입자 수',
    }),
    ApiProperty({
      name: 'discordBeforeJoinCount',
      type: Number,
      example: discordBeforeJoinCount,
      description: '디스코드 가입자 수 (기준 시간)',
    }),
    ApiProperty({
      name: 'discordDeviation',
      type: Number,
      example: discordDeviation,
      description: '디스코드 가입자 수 변화량',
    }),
    ApiProperty({
      name: 'discordDeviationPercent',
      type: Number,
      example: discordDeviationPercent,
      description: "디스코드 가입자 수 변화량 퍼센트 ('%' 제외)",
    }),
    ApiProperty({
      name: 'staticCreateAt',
      type: Date,
      example: staticCreateAt,
      description: '생성 시간 (static)',
    }),
    ApiProperty({
      name: 'createdAt',
      type: Date,
      example: createdAt,
      description: '생성된 시간',
    }),
    ApiProperty({
      name: 'updatedAt',
      type: Date,
      example: updatedAt,
      description: '업데이트된 시간',
    }),
  ];

  propertyDecorators.forEach((decorator, index) => {
    decorator(TrendUpcomingCollection.prototype, index.toString());
  });
}
