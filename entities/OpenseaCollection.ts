import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./Contract";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

export const contractExample: any = {
  id: 1,
  bannerImageUrl:
    "https://i.seadn.io/gcs/files/5e4f9377fd635e426326d74215f344a9.jpg?w=500&auto=format",
  createdDate: new Date(),
  description:
    "2222 Bullies are a small but mighty community! If you are a holder and want to get into a group chat.",
  discordUrl: "https://discord.gg/dedao",
  externalUrl: "https://degods.com",
  imageUrl:
    "https://i.seadn.io/gae/5742ExtD_kaqBxjWdwFudDd30s7hGUki5Lod2vFpBeBvKvT00BcZQbZvcxKnqH8jcC2yWJGN267eMdp3jsdccPqOXyV_G--pFfosBw?w=500&auto=format",
  largeImageUrl: "",
  mediumUsername: "",
  name: "Influence Asteroids",
  shortDescription: "",
  slug: "influenceth-asteroids",
  telegramUrl: "",
  twitterUsername: "influenceth",
  instagramUsername: "",
  wikiUrl: "",
  createAt: new Date(),
  updateAt: new Date(),
};

const {
  id,
  bannerImageUrl,
  createdDate,
  description,
  discordUrl,
  externalUrl,
  imageUrl,
  largeImageUrl,
  mediumUsername,
  name,
  shortDescription,
  slug,
  telegramUrl,
  twitterUsername,
  instagramUsername,
  wikiUrl,
  createdAt,
  updatedAt,
} = contractExample;

@Entity({ name: "openseaCollection" })
export class OpenseaCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Contract, (contract) => contract.openseaCollection, {
    onDelete: "CASCADE",
  })
  contract: Contract;

  @Column({ nullable: true, length: 4000 })
  bannerImageUrl: string;

  @Column({ nullable: true })
  createdDate: Date;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  floorPrice: number;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true, length: 4000 })
  imageUrl: string;

  @Column({ nullable: true })
  largeImageUrl: string;

  @Column({ nullable: true })
  mediumUsername: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  shortDescription: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  telegramUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  instagramUsername: string;

  @Column({ nullable: true })
  wikiUrl: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): OpenseaCollection {
    const instance: any = new OpenseaCollection();

    for (let key in contractExample) {
      instance[key] = contractExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "bannerImageUrl",
      type: String,
      example: bannerImageUrl,
      description: "배너 이미지 URL",
    }),
    ApiProperty({
      name: "createdDate",
      type: Date,
      example: createdDate,
      description: "생성일",
    }),
    ApiProperty({
      name: "description",
      type: String,
      example: description,
      description: "설명",
    }),
    ApiProperty({
      name: "discordUrl",
      type: String,
      example: discordUrl,
      description: "디스코드 URL",
    }),
    ApiProperty({
      name: "externalUrl",
      type: String,
      example: externalUrl,
      description: "외부 URL",
    }),
    ApiProperty({
      name: "imageUrl",
      type: String,
      example: imageUrl,
      description: "이미지 URL",
    }),
    ApiProperty({
      name: "largeImageUrl",
      type: String,
      example: largeImageUrl,
      description: "큰 이미지 URL",
    }),
    ApiProperty({
      name: "mediumUsername",
      type: String,
      example: mediumUsername,
      description: "미디엄 유저네임",
    }),
    ApiProperty({
      name: "name",
      type: String,
      example: name,
      description: "이름",
    }),
    ApiProperty({
      name: "shortDescription",
      type: String,
      example: shortDescription,
      description: "짧은 설명",
    }),
    ApiProperty({
      name: "slug",
      type: String,
      example: slug,
      description: "slug",
    }),
    ApiProperty({
      name: "telegramUrl",
      type: String,
      example: telegramUrl,
      description: "텔레그램 URL",
    }),
    ApiProperty({
      name: "twitterUsername",
      type: String,
      example: twitterUsername,
      description: "트위터 유저네임",
    }),
    ApiProperty({
      name: "instagramUsername",
      type: String,
      example: instagramUsername,
      description: "인스타그램 유저네임",
    }),
    ApiProperty({
      name: "wikiUrl",
      type: String,
      example: wikiUrl,
      description: "위키 URL",
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
    decorator(OpenseaCollection.prototype, index.toString());
  });
}
