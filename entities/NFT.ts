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
} from "typeorm";
import { Contract } from "./Contract";
import { Log } from "./Log";
import { nftExample } from "../entityExamples";
import * as dotenv from "dotenv";
import { AttributeNFT } from "./AttributeNFT";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "nft" })
@Unique("uniqueIndex", ["contract", "tokenId"])
export class NFT {
  @PrimaryGeneratedColumn()
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

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  mediaThumbnail: string;

  @Column({ nullable: true, type: "longtext" })
  rawMetadataImage: string;

  @Column({ nullable: true, type: "longtext" })
  attributesRaw: string;

  @Column({ nullable: true, type: "longtext" })
  imageRaw: string;

  @Column({ nullable: true })
  imageFormat: string;

  @Column({ nullable: true })
  imageBytes: number;

  @OneToMany(() => Log, (log) => log.nft, {
    onDelete: "SET NULL",
  })
  logs: Log[];

  @OneToMany(() => AttributeNFT, (attributeNFT) => attributeNFT.nft, {
    onDelete: "CASCADE",
  })
  attributeNFTs: AttributeNFT[];

  @Column({ nullable: true, default: null })
  isAttributeUpdated: boolean;

  @Column({ nullable: true, default: null, length: 1000 })
  imageRoute: string;

  @Column({ nullable: true, default: null })
  isImageUploaded: boolean;

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
    mediaThumbnail,
    rawMetadataImage,
    logs,
    attributesRaw,
    imageRaw,
    imageFormat,
    imageBytes,
    isAttributeUpdated,
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
      name: "mediaThumbnail",
      type: String,
      example: mediaThumbnail,
      description: "미디어 썸네일",
    }),
    ApiProperty({
      name: "rawMetadataImage",
      type: String,
      example: rawMetadataImage,
      description: "메타데이터 이미지",
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
      name: "imageFormat",
      type: String,
      example: imageFormat,
      description: "이미지 포맷",
    }),

    ApiProperty({
      name: "imageBytes",
      type: Number,
      example: imageBytes,
      description: "이미지 용량",
    }),

    ApiProperty({
      name: "isAttributeUpdated",
      type: Boolean,
      example: isAttributeUpdated,
      description: "특성 업데이트 여부",
    }),

    // ApiProperty({
    //   name: 'logs',
    //   type: Log,
    //   example: logs,
    //   description: '메타데이터 이미지',
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
    decorator(NFT.prototype, index.toString());
  });
}
