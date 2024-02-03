import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
} from "typeorm";

@Entity({ name: "decodeError" })
export class DecodeError {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ nullable: true })
  blockNumber: number;

  @Column({ nullable: true })
  signature: String;

  @Column({ nullable: true })
  data: String;

  @Column({ nullable: true })
  log: String;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
