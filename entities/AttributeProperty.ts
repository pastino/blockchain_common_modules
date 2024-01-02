import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  Index,
} from "typeorm";
import * as dotenv from "dotenv";
import { Attribute } from "./Attribute";
import { NFT } from "./NFT";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "attributeProperty" })
@Index("idx_attributeproperty_nft_attribute_value", [
  "nft",
  "attribute",
  "value",
])
export class AttributeProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NFT, (nft) => nft.attributeProperties)
  @JoinColumn({ name: "nftId", referencedColumnName: "id" })
  nft: NFT;

  @ManyToOne(() => Attribute, (attribute) => attribute.properties)
  @JoinColumn({ name: "attributeId", referencedColumnName: "id" })
  attribute: Attribute;

  @Column({ nullable: true })
  value: string;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): Attribute {
    const instance: any = new Attribute();

    //   for (let key in blockNumberExample) {
    //     instance[key] = blockNumberExample[key];
    //   }

    return instance;
  }
}
