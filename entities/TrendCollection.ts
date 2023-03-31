import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Contract } from "./Contract";

export enum TimeRange {
  ONE_HOUR = "1H",
  SIX_HOURS = "6H",
  TWELVE_HOURS = "12H",
  TWENTY_FOUR_HOURS = "24H",
}

@Entity({ name: "trendCollection" })
export class TrendCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.trendCollections)
  @JoinColumn({ name: "contractId", referencedColumnName: "id" })
  contract: Contract;

  @Column({ nullable: true })
  floorPrice: string;

  @Column({ nullable: true })
  volume: string;

  @Column({ type: "enum", enum: TimeRange })
  timeRange: TimeRange;

  @Column({ nullable: true })
  sales: number;

  @Column({ type: Date, default: () => "CURRENT_TIMESTAMP" })
  staticCreateAt: Date;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
