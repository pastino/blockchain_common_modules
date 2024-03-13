import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import * as dotenv from "dotenv";
import { Category } from "./Category";
import { Contract } from "./Contract";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "categoryContractMapping" })
export class CategoryContractMapping {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(() => Category, (category) => category.categoryContractMapping, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "categoryId", referencedColumnName: "id" })
  category: Category;

  @ManyToOne(() => Contract, (contract) => contract.categoryContractMapping, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
