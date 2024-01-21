import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import * as dotenv from "dotenv";
import { Attribute } from "./Attribute";
import { NFT } from "./NFT";
import { AttributeProperty } from "./AttributeProperty";
import { attributePropNFTMappingExample } from "../entityExamples";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "attributePropNFTMapping" })
@Unique("attributePropNFTMappingUnique", ["property", "nft"])
@Index("idx_attribute_mapping_nft", ["nft"])
@Index("idx_attribute_mapping_property", ["property"])
export class AttributePropNFTMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => AttributeProperty,
    (property) => property.attributePropNFTMapping,
    {
      onDelete: "CASCADE",
    }
  )
  @JoinColumn({ name: "propertyId", referencedColumnName: "id" })
  property: AttributeProperty;

  @ManyToOne(() => NFT, (nft) => nft.attributePropNFTMappings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "nftId", referencedColumnName: "id" })
  nft: NFT;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): Attribute {
    const instance: any = new Attribute();

    for (let key in attributePropNFTMappingExample) {
      instance[key] = attributePropNFTMappingExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const { id, property, nft, createdAt, updatedAt } =
    attributePropNFTMappingExample;

  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "property",
      type: () => AttributeProperty,
      example: property,
      description: "속성값",
    }),
    ApiProperty({
      name: "nft",
      type: () => NFT,
      example: nft,
      description: "nft",
    }),
    ApiProperty({
      name: "createdAt",
      type: Date,
      example: createdAt,
      description: "생성된 시간",
    }),
    ApiProperty({
      name: "updatedAt",
      type: Date,
      example: updatedAt,
      description: "업데이트된 시간",
    }),
  ];

  propertyDecorators.forEach((decorator, index) => {
    decorator(AttributePropNFTMapping.prototype, index.toString());
  });
}
