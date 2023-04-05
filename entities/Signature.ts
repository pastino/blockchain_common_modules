import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";

@Entity({ name: "signature" })
export class Signature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  signatureId: number;

  @Column({ type: "longtext", nullable: false })
  textSignature: string;

  @Column({ nullable: false })
  hexSignature: string;

  @Column({ nullable: false })
  bytesSignature: string;

  @Column({ nullable: false })
  createdDate: Date;

  @CreateDateColumn()
  createAt: Date;
  @UpdateDateColumn()
  updateAt: Date;
}
