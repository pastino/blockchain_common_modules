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
  ManyToOne,
} from "typeorm";
import { NFT } from "./NFT";
import { TrendCollection } from "./TrendCollection";
import { OpenseaCollection } from "./OpenseaCollection";
import { Attribute } from "./Attribute";
import { Log } from "./Log";
import * as dotenv from "dotenv";
import { contractExample } from "../entityExamples";
import { ContractDetail } from "./ContractDetail";
import { UpcomingContract } from "./UpcomingContract";
import { Brand } from "./Brand";
import { CategoryContractMapping } from "./CategoryContractMapping";
import { CategorySubContractMapping } from "./CategorySubContractMapping";
import { ContractContractMapping } from "./ContractContractMapping";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

// slug 추가
@Entity({ name: "contract" })
@Unique(["address"])
@Index("idx_contract_openseaCollection", ["openseaCollection"])
export class Contract {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  totalSupply: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: "text", nullable: true })
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

  @Column({ nullable: true, default: null })
  createdDate: Date;

  @OneToOne(
    () => OpenseaCollection,
    (openseaCollectio) => openseaCollectio.contract,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "openseaCollectionId", referencedColumnName: "id" })
  openseaCollection: OpenseaCollection;

  @OneToOne(() => ContractDetail, (contractDetail) => contractDetail.contract, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractDetailId", referencedColumnName: "id" })
  contractDetail: ContractDetail;

  @OneToMany(() => NFT, (nft) => nft.contract, {
    onDelete: "CASCADE",
  })
  nfts: NFT[];

  @OneToMany(() => Log, (log) => log.contract, {
    onDelete: "RESTRICT",
  })
  logs: Log[];

  @OneToMany(() => Log, (log) => log.contract, {
    onDelete: "CASCADE",
  })
  attributes: Attribute[];

  @OneToMany(
    () => TrendCollection,
    (trendCollection) => trendCollection.contract,
    {
      onDelete: "CASCADE",
    }
  )
  trendCollections: TrendCollection[];

  @ManyToOne(() => Brand, (brand) => brand.contracts, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "brandId", referencedColumnName: "id" })
  brand: Brand;

  @OneToMany(
    () => CategoryContractMapping,
    (categoryContractMapping) => categoryContractMapping.contract,
    {
      onDelete: "SET NULL",
    }
  )
  categoryContractMapping: CategoryContractMapping[];

  @OneToMany(
    () => CategorySubContractMapping,
    (categorySubContractMapping) => categorySubContractMapping.contract,
    {
      onDelete: "SET NULL",
    }
  )
  categorySubContractMapping: CategorySubContractMapping[];

  @OneToMany(
    () => ContractContractMapping,
    (contractContractMapping) => contractContractMapping.contract,
    {
      onDelete: "SET NULL",
    }
  )
  contractContractMapping: ContractContractMapping[];

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
    isNFTsCreated,
    nftProgressStatus,
    createdNFTsPageNumber,
    createdNFTsPageKey,
    alchemyCollectionError,
    traitTypeContracts,
    contractDetail,
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

    ApiProperty({
      name: "isNFTsCreated",
      type: Boolean,
      example: isNFTsCreated,
      description: "NFT 생성 여부",
    }),
    ApiProperty({
      name: "nftProgressStatus",
      type: String,
      example: nftProgressStatus,
      description: "NFT 생성 상태",
    }),
    ApiProperty({
      name: "createdNFTsPageNumber",
      type: Number,
      example: createdNFTsPageNumber,
      description: "생성된 NFT 페이지 넘버",
    }),
    ApiProperty({
      name: "createdNFTsPageKey",
      type: String,
      example: createdNFTsPageKey,
      description: "생성된 NFT 페이지 키",
    }),
    ApiProperty({
      name: "alchemyCollectionError",
      type: String,
      example: alchemyCollectionError,
      description: "Alchemy 컬렉션 에러",
    }),
    ApiProperty({
      name: "nfts",
      type: () => [NFT],
      example: deployedBlockNumber,
      description: "NFT 데이터",
    }),
    ApiProperty({
      name: "contractDetail",
      type: ContractDetail,
      example: contractDetail,
      description: "컬랙션 상세 데이터",
    }),
    ApiProperty({
      name: "logs",
      type: () => [Log],
      example: logs,
      description: "Log 데이터",
    }),

    ApiProperty({
      name: "trendCollections",
      type: () => [TrendCollection],
      example: trendCollections,
      description: "트렌드 컬렉션 데이터",
    }),
    ApiProperty({
      name: "createdDate",
      type: Date,
      example: createdAt,
      description: "컬랙션 처음 생성된 시간",
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
    decorator(Contract.prototype, index.toString());
  });
}
