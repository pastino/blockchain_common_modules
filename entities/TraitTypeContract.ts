import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Contract } from "./Contract";
import { TraitType } from "./TraitType";

@Entity({ name: "traitTypeContract" })
export class TraitTypeContract {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TraitType)
  @JoinColumn({ name: "traitTypeId" })
  traitType: TraitType;

  @ManyToOne(() => Contract, (contract) => contract.traitTypeContracts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractId" })
  contract: Contract;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
