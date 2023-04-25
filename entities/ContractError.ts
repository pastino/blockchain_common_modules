import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";

@Entity({ name: "contractError" })
@Unique(["address"])
export class ContractError {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column({ type: "longtext", nullable: true })
  returnStringData: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
