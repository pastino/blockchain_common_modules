import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TraitType } from "./TraitType";
import { AttributeNFT } from "./AttributeNFT";

@Entity({ name: "attribute" })
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @ManyToOne(() => TraitType)
  @JoinColumn({ name: "traitTypeId" })
  traitType: TraitType;

  @OneToMany(() => AttributeNFT, (attributeNFT) => attributeNFT.attribute)
  attributeNFTs: AttributeNFT[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
