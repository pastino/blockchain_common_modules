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

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "contractDetail" })
export class ContractDetail {
  @PrimaryGeneratedColumn()
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

  // static example(): ContractDetail {
  //   const instance: any = new ContractDetail();

  //   for (let key in contractExample) {
  //     instance[key] = contractExample[key];
  //   }

  //   return instance;
  // }
}
