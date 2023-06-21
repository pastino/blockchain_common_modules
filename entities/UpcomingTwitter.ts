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

@Entity({ name: "upcomingTwitter" })
export class UpcomingTwitter {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => UpcomingContract,
    (upcomingContract) => upcomingContract.upcomingTwitters,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "upcomingContractId", referencedColumnName: "id" })
  upcomingContract: UpcomingContract;

  @Column({ nullable: false })
  followerCount: number;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
