import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import * as dotenv from "dotenv";
import { Contract } from "./Contract";
import { CategorySub } from "./CategorySub";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "categorySubContractMapping" })
export class CategorySubContractMapping {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(
    () => CategorySub,
    (categorySub) => categorySub.categorySubContractMapping,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "categorySubId", referencedColumnName: "id" })
  categorySub: CategorySub;

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
