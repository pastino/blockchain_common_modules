import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { Log } from "./Log";

@Entity({ name: "topic" })
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Log, (log) => log.topics)
  @JoinColumn({ name: "logId", referencedColumnName: "id" })
  log: Log;

  @Column({ nullable: true })
  topic: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
