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
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
