import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { NFT } from "./NFT";
import { TrendCollection } from "./TrendCollection";
import { OpenseaCollection } from "./OpenseaCollection";
import { Log } from "./Log";
import * as dotenv from "dotenv";
import { contractExample } from "../entityExamples";
import { TraitTypeContract } from "./TraitTypeContract";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

// slug 추가
@Entity({ name: "contract" })
@Unique(["address"])
@Index("idx_contract_address", ["address"])
export class Contract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  totalSupply: string;

  @Column({ nullable: true })
  isSpam: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true })
  contractDeployer: string;

  @Column({ nullable: true })
  deployedBlockNumber: number;

  @OneToOne(
    () => OpenseaCollection,
    (openseaCollectio) => openseaCollectio.contract,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "openseaCollectionId", referencedColumnName: "id" })
  openseaCollection: OpenseaCollection;

  @OneToMany(() => NFT, (nft) => nft.contract, {
    onDelete: "CASCADE",
  })
  nfts: NFT[];

  @OneToMany(() => Log, (log) => log.contract, {
    onDelete: "SET NULL",
  })
  logs: Log[];

  @OneToMany(
    () => TrendCollection,
    (trendCollection) => trendCollection.contract,
    {
      onDelete: "CASCADE",
    }
  )
  trendCollections: TrendCollection[];

  @OneToMany(
    () => TraitTypeContract,
    (traitTypeContract) => traitTypeContract.contract,
    {
      onDelete: "CASCADE",
    }
  )
  traitTypeContracts: TraitTypeContract[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): Contract {
    const instance: any = new Contract();

    for (let key in contractExample) {
      instance[key] = contractExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    openseaCollection,
    address,
    tokenId,
    name,
    totalSupply,
    isSpam,
    imageUrl,
    description,
    externalUrl,
    twitterUsername,
    discordUrl,
    symbol,
    tokenType,
    contractDeployer,
    deployedBlockNumber,
    nfts,
    logs,
    trendCollections,
    createdAt,
    updatedAt,
  } = contractExample;

  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "openseaCollection",
      type: OpenseaCollection,
      example: openseaCollection,
      description: "오픈시 컬랙션 데이터",
    }),
    ApiProperty({
      name: "address",
      type: String,
      example: address,
      description: "Contract Address",
    }),
    ApiProperty({
      name: "tokenId",
      type: String,
      example: tokenId,
      description: "Token ID",
    }),
    ApiProperty({
      name: "name",
      type: String,
      example: name,
      description: "Contract Name",
    }),
    ApiProperty({
      name: "totalSupply",
      type: Number,
      example: totalSupply,
      description: "초기 발행량",
    }),
    ApiProperty({
      name: "isSpam",
      type: Boolean,
      example: isSpam,
      description: "스팸인지",
    }),
    ApiProperty({
      name: "imageUrl",
      type: String,
      example: imageUrl,
      description: "이미지 URL",
    }),
    ApiProperty({
      name: "description",
      type: String,
      example: description,
      description: "설명",
    }),
    ApiProperty({
      name: "externalUrl",
      type: String,
      example: externalUrl,
      description: "외부 URL(홈페이지)",
    }),
    ApiProperty({
      name: "twitterUsername",
      type: String,
      example: twitterUsername,
      description: "트위터 유저네임",
    }),
    ApiProperty({
      name: "discordUrl",
      type: String,
      example: discordUrl,
      description: "디스코드 URL",
    }),
    ApiProperty({
      name: "symbol",
      type: String,
      example: symbol,
      description: "컨트랙트 심볼",
    }),
    ApiProperty({
      name: "tokenType",
      type: String,
      example: tokenType,
      description: "토큰 타입",
    }),
    ApiProperty({
      name: "contractDeployer",
      type: String,
      example: contractDeployer,
      description: "컨트랙트 배포자",
    }),
    ApiProperty({
      name: "deployedBlockNumber",
      type: Number,
      example: deployedBlockNumber,
      description: "배포된 블록 넘버",
    }),
    // ApiProperty({
    //   name: 'nfts',
    //   type: [NFT],
    //   example: deployedBlockNumber,
    //   description: '배포된 블록 넘버',
    // }),
    // ApiProperty({
    //   name: 'logs',
    //   type: [Log],
    //   example: logs,
    //   description: '배포된 블록 넘버',
    // }),
    // ApiProperty({
    //   name: 'trendCollections',
    //   type: Number,
    //   example: trendCollections,
    //   description: '배포된 블록 넘버',
    // }),
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
    decorator(Contract.prototype, index.toString());
  });
}
