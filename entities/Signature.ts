import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";

@Entity({ name: "signature" })
export class Signature {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @Column({ nullable: false })
  signatureId: number;

  @Column({ type: "text", nullable: false })
  textSignature: string;

  @Column({ nullable: false })
  hexSignature: string;

  @Column({ nullable: false })
  bytesSignature: string;

  @Column({ nullable: false })
  createdDate: Date;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
