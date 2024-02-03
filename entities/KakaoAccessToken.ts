import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "kakaoAccessToken" })
export class KakaoAccessToken {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ nullable: true })
  accessToken: string;

  @Column({ nullable: true })
  expiresIn: number;

  @Column({ nullable: true })
  scope: string;

  @Column({ nullable: true })
  refreshTokenExpiresIn: number;

  @Column({ nullable: true })
  refreshToken: string;

  @Column({ nullable: true })
  tokenType: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
