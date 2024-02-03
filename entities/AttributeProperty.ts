import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  OneToMany,
} from "typeorm";
import * as dotenv from "dotenv";
import { Attribute } from "./Attribute";
import { AttributePropNFTMapping } from "./AttributePropNFTMapping";
import { attributePropertyExample } from "../entityExamples";

dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const ApiProperty = isNestJs
  ? require("@nestjs/swagger").ApiProperty
  : () => {};

@Entity({ name: "attributeProperty" })
@Unique("attributePropertyUnique", ["attribute", "value"])
@Index("idx_attributeproperty_attribute_value", ["attribute", "value"])
export class AttributeProperty {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: number;

  @ManyToOne(() => Attribute, (attribute) => attribute.properties, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "attributeId", referencedColumnName: "id" })
  attribute: Attribute;

  @Column({ nullable: true })
  value: string;

  @OneToMany(
    () => AttributePropNFTMapping,
    (attributePropNFTMapping) => attributePropNFTMapping.property,
    {
      onDelete: "CASCADE",
    }
  )
  attributePropNFTMapping: AttributePropNFTMapping[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): Attribute {
    const instance: any = new Attribute();

    for (let key in attributePropertyExample) {
      instance[key] = attributePropertyExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const { id, attribute, value, createdAt, updatedAt } =
    attributePropertyExample;

  const propertyDecorators = [
    ApiProperty({
      name: "id",
      type: Number,
      example: id,
      description: "Uniqe ID",
    }),
    ApiProperty({
      name: "attribute",
      type: () => Attribute,
      example: attribute,
      description: "속성 타입",
    }),
    ApiProperty({
      name: "value",
      type: String,
      example: value,
      description: "속성값",
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
    decorator(AttributeProperty.prototype, index.toString());
  });
}
