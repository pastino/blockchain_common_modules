import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { nftExample } from "../entityExamples";
import * as dotenv from "dotenv";
import { TraitTypeContract } from "./TraitTypeContract";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "traitType" })
export class TraitType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  traitType: string;

  @OneToMany(
    () => TraitTypeContract,
    (traitTypeContract) => traitTypeContract.traitType,
    {
      onDelete: "CASCADE",
    }
  )
  traitTypeContracts: TraitTypeContract[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): TraitType {
    const instance: any = new TraitType();

    for (let key in nftExample) {
      instance[key] = nftExample[key];
    }

    return instance;
  }
}

// if (isNestJs) {
//   const {
//     id,
//     contract,
//     tokenId,
//     tokenType,
//     title,
//     description,
//     mediaThumbnail,
//     rawMetadataImage,
//     logs,
//     createdAt,
//     updatedAt,
//   } = nftExample;

//   const propertyDecorators = [
//     ApiProperty({
//       name: "id",
//       type: Number,
//       example: id,
//       description: "Uniqe ID",
//     }),

//     ApiProperty({
//       name: "contract",
//       type: () => Contract,
//       example: contract,
//       description: "Contract",
//     }),
//     ApiProperty({
//       name: "tokenId",
//       type: String,
//       example: tokenId,
//       description: "토큰 ID",
//     }),
//     ApiProperty({
//       name: "tokenType",
//       type: String,
//       example: tokenType,
//       description: "토큰 타입",
//     }),
//     ApiProperty({
//       name: "title",
//       type: String,
//       example: title,
//       description: "제목",
//     }),
//     ApiProperty({
//       name: "description",
//       type: String,
//       example: description,
//       description: "설명",
//     }),
//     ApiProperty({
//       name: "mediaThumbnail",
//       type: String,
//       example: mediaThumbnail,
//       description: "미디어 썸네일",
//     }),
//     ApiProperty({
//       name: "rawMetadataImage",
//       type: String,
//       example: rawMetadataImage,
//       description: "메타데이터 이미지",
//     }),
//     // ApiProperty({
//     //   name: 'logs',
//     //   type: Log,
//     //   example: logs,
//     //   description: '메타데이터 이미지',
//     // }),
//     ApiProperty({
//       name: "createdAt",
//       type: Date,
//       example: createdAt,
//       description: "생성된 시간",
//     }),
//     ApiProperty({
//       name: "updatedAt",
//       type: Date,
//       example: updatedAt,
//       description: "업데이트된 시간",
//     }),
//   ];

//   propertyDecorators.forEach((decorator, index) => {
//     decorator(NFT.prototype, index.toString());
//   });
// }
