import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BlockNumber } from './BlockNumber';
import { Contract } from './Contract';
import { Log } from './Log';
import { transactionExample } from '../entityExamples';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

const {
  id,
  hash,
  timestamp,
  contract,
  eventTime,
  blockHash,
  transactionIndex,
  confirmations,
  blockNumber,
  to,
  from,
  gasPrice,
  gasLimit,
  value,
  nonce,
  data,
  chainId,
  logs,
  createAt,
  updateAt,
} = transactionExample;

@Entity({ name: 'transaction' })
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  hash: string;

  @Column({ nullable: true })
  timestamp: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts)
  @JoinColumn({ name: 'contractId', referencedColumnName: 'id' })
  contract: Contract;

  @Column({ nullable: true })
  eventTime: Date;

  @Column({ nullable: true })
  blockHash: string;

  @ManyToOne(() => BlockNumber, (blockNumber) => blockNumber.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blockNumberId', referencedColumnName: 'id' })
  blockNumber: BlockNumber;

  @Column({ nullable: true })
  transactionIndex: number;

  @Column({ nullable: true })
  confirmations: number;

  @Column({ nullable: true })
  to: string;

  @Column({ nullable: true })
  from: string;

  @Column({ nullable: true })
  gasPrice: string;

  @Column({ nullable: true })
  gasLimit: string;

  @Column({ nullable: true })
  value: string;

  @Column({ nullable: true })
  nonce: number;

  @Column({ type: 'longtext', nullable: true })
  data: string;

  @Column({ nullable: true })
  chainId: number;

  @OneToMany(() => Log, (log) => log.transaction, {
    onDelete: 'CASCADE',
  })
  logs: Log[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;

  static example(): Transaction {
    const instance: any = new Transaction();

    for (let key in transactionExample) {
      instance[key] = transactionExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const propertyDecorators = [
    ApiProperty({
      name: 'id',
      type: Number,
      example: id,
      description: 'Uniqe ID',
    }),
    ApiProperty({
      name: 'hash',
      type: String,
      example: hash,
      description: '트랜잭션 해시',
    }),
    ApiProperty({
      name: 'timestamp',
      type: Number,
      example: timestamp,
      description: '트랜잭션 발생 시간',
    }),
    ApiProperty({
      name: 'contract',
      type: Contract,
      example: contract,
      description: 'Contract',
    }),
    ApiProperty({
      name: 'eventTime',
      type: Date,
      example: eventTime,
      description: '이벤트 발생 시간',
    }),
    ApiProperty({
      name: 'blockHash',
      type: String,
      example: blockHash,
      description: '블록 해시',
    }),
    ApiProperty({
      name: 'transactionIndex',
      type: Number,
      example: transactionIndex,
      description: '트랜잭션 인덱스',
    }),
    ApiProperty({
      name: 'confirmations',
      type: Number,
      example: confirmations,
      description: '확인 횟수',
    }),
    // ApiProperty({
    //   name: 'blockNumber',
    //   type: Number,
    //   example: blockNumber,
    //   description: '확인 횟수',
    // }),
    ApiProperty({
      name: 'to',
      type: String,
      example: to,
      description: '받는 주소',
    }),
    ApiProperty({
      name: 'from',
      type: String,
      example: from,
      description: '보내는 주소',
    }),
    ApiProperty({
      name: 'gasPrice',
      type: String,
      example: gasPrice,
      description: '가스 가격',
    }),
    ApiProperty({
      name: 'gasLimit',
      type: String,
      example: gasLimit,
      description: '가스 리밋',
    }),
    ApiProperty({
      name: 'value',
      type: String,
      example: value,
      description: '값',
    }),
    ApiProperty({
      name: 'nonce',
      type: Number,
      example: nonce,
      description: 'nonce',
    }),
    ApiProperty({
      name: 'data',
      type: String,
      example: data,
      description: 'data',
    }),
    ApiProperty({
      name: 'chainId',
      type: Number,
      example: chainId,
      description: 'chainId',
    }),
    ApiProperty({
      name: 'logs',
      type: [Log],
      example: logs,
      description: 'logs',
    }),
    ApiProperty({
      name: 'createAt',
      type: Date,
      example: createAt,
      description: '생성된 시간',
    }),
    ApiProperty({
      name: 'updateAt',
      type: Date,
      example: updateAt,
      description: '업데이트된 시간',
    }),
  ];

  propertyDecorators.forEach((decorator, index) => {
    decorator(Transaction.prototype, index.toString());
  });
}
