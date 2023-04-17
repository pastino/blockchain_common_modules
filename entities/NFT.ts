import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Contract } from './Contract';
import { Log } from './Log';
import { nftExample } from '../entityExamples';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

const {
  id,
  contract,
  tokenId,
  tokenType,
  title,
  description,
  mediaThumbnail,
  rawMetadataImage,
  logs,
  createAt,
  updateAt,
} = nftExample;

@Entity({ name: 'nft' })
@Unique('uniqueIndex', ['contract', 'tokenId'])
export class NFT {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts)
  @JoinColumn({ name: 'contractId', referencedColumnName: 'id' })
  contract: Contract;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true, length: 1000 })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ nullable: true })
  mediaThumbnail: string;

  @Column({ nullable: true })
  rawMetadataImage: string;

  @OneToMany(() => Log, (log) => log.nft, {
    onDelete: 'SET NULL',
  })
  logs: Log[];

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;

  static example(): NFT {
    const instance: any = new NFT();

    for (let key in nftExample) {
      instance[key] = nftExample[key];
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
      name: 'contract',
      type: () => Contract,
      example: contract,
      description: 'Contract',
    }),
    ApiProperty({
      name: 'tokenId',
      type: String,
      example: tokenId,
      description: '토큰 ID',
    }),
    ApiProperty({
      name: 'tokenType',
      type: String,
      example: tokenType,
      description: '토큰 타입',
    }),
    ApiProperty({
      name: 'title',
      type: String,
      example: title,
      description: '제목',
    }),
    ApiProperty({
      name: 'description',
      type: String,
      example: description,
      description: '설명',
    }),
    ApiProperty({
      name: 'mediaThumbnail',
      type: String,
      example: mediaThumbnail,
      description: '미디어 썸네일',
    }),
    ApiProperty({
      name: 'rawMetadataImage',
      type: String,
      example: rawMetadataImage,
      description: '메타데이터 이미지',
    }),
    // ApiProperty({
    //   name: 'logs',
    //   type: Log,
    //   example: logs,
    //   description: '메타데이터 이미지',
    // }),
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
    decorator(NFT.prototype, index.toString());
  });
}
