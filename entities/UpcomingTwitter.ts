import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UpcomingContract } from "./UpcomingContract";
import { upcomingTwitterExample } from "../entityExamples";
import * as dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "upcomingTwitter" })
export class UpcomingTwitter {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(
    () => UpcomingContract,
    (upcomingContract) => upcomingContract.upcomingTwitters,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "upcomingContractId", referencedColumnName: "id" })
  upcomingContract: UpcomingContract;

  @Column({ nullable: false })
  followerCount: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): UpcomingTwitter {
    const instance: any = new UpcomingTwitter();

    for (let key in upcomingTwitterExample) {
      instance[key] = upcomingTwitterExample[key];
    }

    return instance;
  }
}

const { id, upcomingContract, followerCount, createdAt, updatedAt } =
  upcomingTwitterExample;

if (isNestJs) {
  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "upcomingContract",
      type: () => UpcomingContract,
      example: upcomingContract,
      description: "업커밍 컬렉션",
    }),
    ApiProperty({
      name: "followerCount",
      type: Number,
      example: followerCount,
      description: "트위터 팔로워 수",
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
    decorator(UpcomingTwitter.prototype, index.toString());
  });
}
