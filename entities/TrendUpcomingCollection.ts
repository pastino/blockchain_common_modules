import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UpcomingContract } from "./UpcomingContract";

export enum TimeRange {
  ONE_DAYS = "1D",
  THREE_HOURS = "3D",
  SEVEN_HOURS = "7D",
  FOURTEEN_HOURS = "14D",
}

@Entity({ name: "trendUpcomingCollection" })
export class TrendUpcomingCollection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => UpcomingContract,
    (upcomingContract) => upcomingContract.trendUpcomingCollections
  )
  @JoinColumn({ name: "upcomingContractId", referencedColumnName: "id" })
  upcomingContract: UpcomingContract;

  @Column({ type: "enum", enum: TimeRange })
  timeRange: TimeRange;

  @Column({ nullable: true })
  twitterFollowerCount: number;

  @Column({ nullable: true })
  twitterBeforeFollowerCount: number;

  @Column({ nullable: true, type: "float" })
  twitterDeviation: number;

  @Column({ nullable: true, type: "float" })
  twitterDeviationPercent: number;

  @Column({ nullable: true })
  discordJoinCount: number;

  @Column({ nullable: true })
  discordBeforeJoinCount: number;

  @Column({ nullable: true, type: "float" })
  discordDeviation: number;

  @Column({ nullable: true, type: "float" })
  discordDeviationPercent: number;

  @Column({ type: Date, default: () => "CURRENT_TIMESTAMP" })
  staticCreateAt: Date;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
