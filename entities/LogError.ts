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

  // blockNumber만 있고, transactionHash와 logId가 없다면 블록넘버 저장 에러로 해당 블록 트랜잭션 다시 저장 필요
  @Column({ nullable: false, unique: true })
  blockNumber: number;

  @Column({ nullable: true })
  transactionHash: string;

  @Column({ nullable: true })
  logId: number;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
