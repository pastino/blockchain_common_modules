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
  
  @Entity({ name: "contractContractMapping" })
  export class ContractContractMapping {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id: number;
  
    @ManyToOne(
      () => Contract,
      (contract) => contract.categorySubContractMapping,
      {
        onDelete: "CASCADE",
      }
    )
    @JoinColumn({ name: "contractId", referencedColumnName: "id" })
    contract: Contract;
  
    @ManyToOne(() => Contract, (contract) => contract.categoryContractMapping, {
      onDelete: "CASCADE",
    })
    @JoinColumn({ name: "contractItemId", referencedColumnName: "id" })
    contractItem: Contract;
  
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    updatedAt: Date;
  }
  