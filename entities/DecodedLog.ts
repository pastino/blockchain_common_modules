import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Action } from "../modules/decodeLog";
import { Log } from "./Log";

@Entity({ name: "decodedLog" })
export class DecodedLog {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Log, (log) => log.decodedLog, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "logId", referencedColumnName: "id" })
  log: Log;

  @Column({ nullable: true })
  action: Action;

  @Column({ nullable: true })
  contract: String;

  @Column({ nullable: true })
  tokenId: String;

  @Column({ nullable: true })
  from: String;

  @Column({ nullable: true })
  to: String;

  @Column({ nullable: true, type: "float" })
  ethValue: number;

  @Column({ nullable: true })
  unit: String;

  @Column({ nullable: true, type: "float" })
  value: number;

  @Column({ nullable: true })
  platform: String;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  minterAddress: String;

  @Column({ nullable: true })
  stage: String;

  @Column({ nullable: true })
  mintCount: number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
