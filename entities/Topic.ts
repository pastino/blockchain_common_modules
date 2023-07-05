import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
} from "typeorm";
import { Log } from "./Log";

@Entity({ name: "topic" })
@Index("idx_topic_log", ["log"])
@Index("idx_topic_topic", ["topic"])
@Index("idx_topic_index", ["index"])
@Index("idx_topic_log_topic_index", ["log", "topic", "index"])
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  index: number;

  @ManyToOne(() => Log, (log) => log.topics, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "logId", referencedColumnName: "id" })
  log: Log;

  @Column({ nullable: false })
  topic: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
