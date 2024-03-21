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
  Index,
} from "typeorm";
import { Contract } from "./Contract";
import { Log } from "./Log";
import { nftExample } from "../entityExamples";
import * as dotenv from "dotenv";
import { AttributePropNFTMapping } from "./AttributePropNFTMapping";
import { DecodedLog } from "./DecodedLog";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "nft" })
@Unique("uniqueIndex", ["contract", "tokenId"])
@Index("idx_nft_contract", ["contract"])
@Index("idx_nft_contract_imageroute", ["contract", "imageRoute"])
export class NFT {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts)
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  tokenType: string;

  @Column({ nullable: true, length: 1000 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true, type: "text" })
  attributesRaw: string;

  @Column({ nullable: true, type: "text" })
  imageRaw: string;

  @OneToMany(() => Log, (log) => log.nft, {
    onDelete: "RESTRICT",
  })
  logs: Log[];

  @OneToMany(() => DecodedLog, (decodedLog) => decodedLog.nft, {
    onDelete: "RESTRICT",
  })
  decodedLogs: DecodedLog[];

  @OneToMany(
    () => AttributePropNFTMapping,
    (attributePropNFTMapping) => attributePropNFTMapping.nft,
    {
      onDelete: "CASCADE",
    }
  )
  attributePropNFTMappings: AttributePropNFTMapping[];

  @Column({ nullable: true, default: null, length: 1000 })
  imageRoute: string;

  @Column({ nullable: true, default: null, length: 1000 })
  imageAlchemyUrl: string;

  @Column({ nullable: false, default: 1 })
  processingStatus: number;

  @Column({ nullable: true, default: null, length: 1000 })
  errorMessage: string;

  @Column({ nullable: true, default: null, length: 1000 })
  errorMessageForImage: string;

  @Column({ nullable: false, default: false })
  isUpdatedComplete: boolean;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): NFT {
    const instance: any = new NFT();

    for (let key in nftExample) {
      instance[key] = nftExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    contract,
    tokenId,
    tokenType,
    title,
    description,
    attributesRaw,
    imageRaw,
    logs,
    imageRoute,
    isImageUploaded,
    imageSaveError,
    isAttributeUpdated,
    imageAlchemyUrl,
    alchemyImageError,
    createdAt,
    updatedAt,
  } = nftExample;

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
      name: "tokenId",
      type: String,
      example: tokenId,
      description: "토큰 ID",
    }),
    ApiProperty({
      name: "tokenType",
      type: String,
      example: tokenType,
      description: "토큰 타입",
    }),
    ApiProperty({
      name: "title",
      type: String,
      example: title,
      description: "제목",
    }),
    ApiProperty({
      name: "description",
      type: String,
      example: description,
      description: "설명",
    }),
    ApiProperty({
      name: "attributesRaw",
      type: String,
      example: attributesRaw,
      description: "특성 데이터",
    }),
    ApiProperty({
      name: "imageRaw",
      type: String,
      example: imageRaw,
      description: "이미지 데이터",
    }),

    ApiProperty({
      name: "imageRoute",
      type: String,
      example: imageRoute,
      description: "이미지 저장 경로",
    }),
    ApiProperty({
      name: "isImageUploaded",
      type: Boolean,
      example: isImageUploaded,
      description: "이미지 저장 여부",
    }),
    ApiProperty({
      name: "imageSaveError",
      type: String,
      example: imageSaveError,
      description: "이미지 저장 시 발생한 에러 정보",
    }),
    ApiProperty({
      name: "isAttributeUpdated",
      type: Boolean,
      example: isAttributeUpdated,
      description: "특성 업데이트 여부",
    }),

    ApiProperty({
      name: "logs",
      type: () => [Log],
      example: logs,
      description: "메타데이터 이미지",
    }),

    ApiProperty({
      name: "imageAlchemyUrl",
      type: String,
      example: imageAlchemyUrl,
      description: "Alechemy 이미지 URL",
    }),
    ApiProperty({
      name: "alchemyImageError",
      type: String,
      example: alchemyImageError,
      description: "Alechemy 이미지 에러 정보",
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
    decorator(NFT.prototype, index.toString());
  });
}
