import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Column,
  ManyToOne,
} from "typeorm";
import * as dotenv from "dotenv";
import { Contract } from "./Contract";
import { ContractDetail } from "./ContractDetail";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "benefit" })
export class Benefit {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ContractDetail, (contractDetail) => contractDetail.benefits)
  @JoinColumn({ name: "contractDetailId", referencedColumnName: "id" })
  contractDetail: ContractDetail;

  @Column({ type: "text", nullable: true })
  benefit: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  // static example(): ContractDetail {
  //   const instance: any = new ContractDetail();

  //   for (let key in contractExample) {
  //     instance[key] = contractExample[key];
  //   }

  //   return instance;
  // }
}
