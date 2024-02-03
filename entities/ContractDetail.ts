import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Column,
  OneToMany,
} from "typeorm";
import * as dotenv from "dotenv";
import { Contract } from "./Contract";
import { Benefit } from "./Benefit";
import { Loadmap } from "./Loadmap";
import { contractDetailExample } from "../entityExamples";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "contractDetail" })
export class ContractDetail {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @OneToOne(() => Contract, (contract) => contract.contractDetail, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ type: "text", nullable: true })
  detailDescription: string;

  @OneToMany(() => Benefit, (benefit) => benefit.contractDetail, {
    onDelete: "CASCADE",
  })
  benefits: Benefit[];

  @OneToMany(() => Loadmap, (loadmap) => loadmap.contractDetail, {
    onDelete: "CASCADE",
  })
  loadmaps: Loadmap[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): ContractDetail {
    const instance: any = new ContractDetail();

    for (let key in contractDetailExample) {
      instance[key] = contractDetailExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const {
    id,
    contract,
    detailDescription,
    benefits,
    loadmaps,
    createdAt,
    updatedAt,
  } = contractDetailExample;

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
      description: "컬렉션 데이터",
    }),
    ApiProperty({
      name: "detailDescription",
      type: String,
      example: detailDescription,
      description: "컬렉션 상세 설명",
    }),

    ApiProperty({
      name: "benefits",
      type: () => [Benefit],
      example: benefits,
      description: "컬렉션 혜택 데이터",
    }),
    ApiProperty({
      name: "loadmaps",
      type: () => [Loadmap],
      example: loadmaps,
      description: "컬렉션 로드맵 데이터",
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
    decorator(ContractDetail.prototype, index.toString());
  });
}
