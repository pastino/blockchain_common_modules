import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
} from "typeorm";
import * as dotenv from "dotenv";
import { Contract } from "./Contract";
import { CategorySubContractMapping } from "./CategorySubContractMapping";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "categorySub" })
export class CategorySub {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ type: "text", nullable: true })
  categorySub: string;

  @Column({ type: "text", nullable: true })
  imageUrl: string;

  @OneToMany(
    () => CategorySubContractMapping,
    (categorySubContractMapping) => categorySubContractMapping.categorySub,
    {
      onDelete: "CASCADE",
    }
  )
  categorySubContractMapping: CategorySubContractMapping[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
