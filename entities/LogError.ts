import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "logError" })
export class LogError {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  blockNumber: number;

  @Column({ nullable: false })
  transactionHash: string;

  @Column({ nullable: false })
  logId: string;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
