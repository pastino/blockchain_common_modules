import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "openseaNFT" })
export class OpenseaNFT {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  tokenId: string;

  @Column({ nullable: true })
  numSales: number;

  @Column({ nullable: true })
  backgroundColor: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  imagePreviewUrl: string;

  @Column({ nullable: true })
  imageThumbnailUrl: string;

  @Column({ nullable: true })
  imageOriginalUrl: string;

  @Column({ nullable: true })
  animationUrl: string;

  @Column({ nullable: true })
  animationOriginalUrl: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  externalLink: string;

  @Column({ nullable: true })
  permalink: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}
