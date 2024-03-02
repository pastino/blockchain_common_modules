import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Column,
  ManyToOne,
} from "typeorm";
import * as dotenv from "dotenv";
import { ContractDetail } from "./ContractDetail";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "issue" })
export class Issue {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(() => ContractDetail, (contractDetail) => contractDetail.issue)
  @JoinColumn({ name: "contractDetailId", referencedColumnName: "id" })
  contractDetail: ContractDetail;

  @Column({ type: "text", nullable: true })
  issue: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
