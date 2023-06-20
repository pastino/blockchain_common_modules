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

@Entity({ name: "upcomingDiscord" })
export class UpcomingDiscord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => UpcomingContract,
    (upcomingContract) => upcomingContract.upcomingDiscords
  )
  @JoinColumn({ name: "upcomingContractId", referencedColumnName: "id" })
  upcomingContract: UpcomingContract;

  @Column({ nullable: false })
  joinCount: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
