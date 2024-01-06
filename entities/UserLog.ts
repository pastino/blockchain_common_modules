import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "userLog" })
export class UserLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
