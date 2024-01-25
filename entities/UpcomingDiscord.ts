import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UpcomingContract } from './UpcomingContract';
import { upcomingDiscordExample } from '../entityExamples';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

@Entity({ name: 'upcomingDiscord' })
export class UpcomingDiscord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => UpcomingContract,
    (upcomingContract) => upcomingContract.upcomingDiscords,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'upcomingContractId', referencedColumnName: 'id' })
  upcomingContract: UpcomingContract;

  @Column({ nullable: false })
  joinCount: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): UpcomingDiscord {
    const instance: any = new UpcomingDiscord();

    for (let key in upcomingDiscordExample) {
      instance[key] = upcomingDiscordExample[key];
    }

    return instance;
  }
}

const { id, upcomingContract, joinCount, createdAt, updatedAt } =
  upcomingDiscordExample;

if (isNestJs) {
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
      description: '업커밍 컬렉션',
    }),
    ApiProperty({
      name: 'joinCount',
      type: Number,
      example: joinCount,
      description: '디스코드 채널 가압자 수',
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
    decorator(UpcomingDiscord.prototype, index.toString());
  });
}
