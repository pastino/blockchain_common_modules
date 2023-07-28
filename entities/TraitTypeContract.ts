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

  @ManyToOne(() => TraitType, (traitType) => traitType.traitTypeContracts, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "traitTypeId" })
  traitType: TraitType;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: "contractId" })
  contract: Contract;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
