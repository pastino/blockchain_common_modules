import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UpcomingTwitter } from "./UpcomingTwitter";
import { UpcomingDiscord } from "./UpcomingDiscord";
import { TrendUpcomingCollection } from "./TrendUpcomingCollection";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

export enum TimeRange {
  ONE_DAYS = "1D",
  THREE_HOURS = "3D",
  SEVEN_HOURS = "7D",
  FOURTEEN_HOURS = "14D",
}

export const upcomingContractExample: any = {
  id: 1,
  publishDate: new Date(),
  name: "YogaPetz",
  category: "",
  totalSupply: 10000,
  bannerImageUrl:
    "https://nft-upcoming.s3.ap-northeast-2.amazonaws.com/banner/760f71d25c812ca70b964b9baf6b0e05.png",
  profileImageUrl:
    "https://nft-upcoming.s3.ap-northeast-2.amazonaws.com/profile/760f71d25c812ca70b964b9baf6b0e05.png",
  description:
    "YogaPetz is a collection of 10,000 NFTs that represents balanced life, true self and mindfulness. Every day this world tells us that we’re not enough but it’s an illusion, because you are already perfect. So despite what this world made you believe, just be yourself and join YogaPetz journey to discover what had been within us all along, because we are seeking the same too.",
  externalUrl: "https://yogapetz.com/",
  twitterUsername: "Yogapetz",
  discordUrl: "https://discord.gg/yogapetz",
  premintUrl: "https://app.mintify.xyz/collection/yogapetz/",
  preSalePrice: 0,
  publicSalePrice: 0,
  tokenType: "ERC721",
  upcomingTwitters: [],
  trendUpcomingCollections: [],
  upcomingDiscords: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const {
  id,
  publishDate,
  name,
  category,
  totalSupply,
  bannerImageUrl,
  profileImageUrl,
  description,
  externalUrl,
  twitterUsername,
  discordUrl,
  premintUrl,
  preSalePrice,
  publicSalePrice,
  tokenType,
  upcomingTwitters,
  trendUpcomingCollections,
  upcomingDiscords,
  createdAt,
  updatedAt,
} = upcomingContractExample;

@Entity({ name: "upcomingContract" })
export class UpcomingContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  publishDate: Date;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true, type: "bigint" })
  totalSupply: number;

  @Column({ nullable: true })
  bannerImageUrl: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  premintUrl: string;

  @Column({ nullable: true, type: "float" })
  preSalePrice: number;

  @Column({ nullable: true, type: "float" })
  publicSalePrice: number;

  @Column({ nullable: true })
  priceUnit: string;

  @Column({ nullable: true, default: "ERC721" })
  tokenType: string;

  @OneToMany(
    () => UpcomingTwitter,
    (upcomingTwitter) => upcomingTwitter.upcomingContract,
    {
      onDelete: "CASCADE",
    }
  )
  upcomingTwitters: UpcomingTwitter[];

  @OneToMany(
    () => TrendUpcomingCollection,
    (trendUpcomingCollection) => trendUpcomingCollection.upcomingContract,
    {
      onDelete: "CASCADE",
    }
  )
  trendUpcomingCollections: TrendUpcomingCollection[];

  @OneToMany(
    () => UpcomingDiscord,
    (UpcomingDiscord) => UpcomingDiscord.upcomingContract,
    {
      onDelete: "CASCADE",
    }
  )
  upcomingDiscords: UpcomingDiscord[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
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
      name: "publishDate",
      type: Date,
      example: publishDate,
      description: "출시일자",
    }),
    ApiProperty({
      name: "name",
      type: String,
      example: name,
      description: "컬렉션 이름",
    }),
    ApiProperty({
      name: "category",
      type: String,
      example: category,
      description: "카테고리",
    }),
    ApiProperty({
      name: "totalSupply",
      type: Number,
      example: totalSupply,
      description: "총 발행량",
    }),
    ApiProperty({
      name: "bannerImageUrl",
      type: String,
      example: bannerImageUrl,
      description: "배너 이미지 URL",
    }),
    ApiProperty({
      name: "profileImageUrl",
      type: String,
      example: profileImageUrl,
      description: "프로파일 이미지 URL",
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
      description: "홈페이지",
    }),

    ApiProperty({
      name: "twitterUsername",
      type: String,
      example: twitterUsername,
      description: "설명",
    }),
    ApiProperty({
      name: "discordUrl",
      type: String,
      example: discordUrl,
      description: "홈페이지",
    }),
    ApiProperty({
      name: "premintUrl",
      type: String,
      example: premintUrl,
      description: "사전 민팅 URL",
    }),
    ApiProperty({
      name: "preSalePrice",
      type: Number,
      example: preSalePrice,
      description: "사전 판매 가격",
    }),
    ApiProperty({
      name: "publicSalePrice",
      type: Number,
      example: publicSalePrice,
      description: "공개 판매 가격",
    }),
    ApiProperty({
      name: "tokenType",
      type: String,
      example: tokenType,
      description: "토큰 타입",
    }),

    // ApiProperty({
    //   name: 'upcomingTwitters',
    //   type: () => [UpcomingTwitter],
    //   example: upcomingTwitters,
    //   description: '트위터',
    // }),
    // ApiProperty({
    //   name: 'trendUpcomingCollections',
    //   type: () => [TrendUpcomingCollection],
    //   example: trendUpcomingCollections,
    //   description: '트렌드 컬렉션',
    // }),
    // ApiProperty({
    //   name: 'upcomingDiscords',
    //   type: () => [UpcomingDiscord],
    //   example: upcomingDiscords,
    //   description: '디스코드',
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
    decorator(UpcomingContract.prototype, index.toString());
  });
}
