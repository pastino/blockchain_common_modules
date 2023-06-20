import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UpcomingTwitter } from "./UpcomingTwitter";
import { UpcomingDiscord } from "./UpcomingDiscord";

@Entity({ name: "upcomingContract" })
export class UpcomingContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  publishDate: Date;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  totalSupply: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: "longtext", nullable: true })
  description: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ nullable: true })
  twitterUsername: string;

  @Column({ nullable: true })
  discordUrl: string;

  @Column({ nullable: true })
  premintUrl: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  tokenType: string;

  @OneToMany(
    () => UpcomingTwitter,
    (upcomingTwitter) => upcomingTwitter.upcomingContract,
    {
      onDelete: "CASCADE",
    }
  )
  upcomingTwitters: UpcomingTwitter[];

  @OneToMany(
    () => UpcomingDiscord,
    (UpcomingDiscord) => UpcomingDiscord.upcomingContract,
    {
      onDelete: "CASCADE",
    }
  )
  upcomingDiscords: UpcomingDiscord[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
