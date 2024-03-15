import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
} from "typeorm";
import * as dotenv from "dotenv";
import { CategoryContractMapping } from "./CategoryContractMapping";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "category" })
export class Category {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ type: "text", nullable: true })
  category: string;

  @Column({ type: "text", nullable: true })
  imageUrl: string;

  @OneToMany(
    () => CategoryContractMapping,
    (categoryContractMapping) => categoryContractMapping.category,
    {
      onDelete: "CASCADE",
    }
  )
  categoryContractMapping: CategoryContractMapping[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
