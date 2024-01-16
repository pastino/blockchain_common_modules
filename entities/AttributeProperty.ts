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
  Unique,
  OneToMany,
} from 'typeorm';
import * as dotenv from 'dotenv';
import { Attribute } from './Attribute';
import { NFT } from './NFT';
import { AttributePropNFTMapping } from './AttributePropNFTMapping';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

@Entity({ name: 'attributeProperty' })
@Unique('attributePropertyUnique', ['attribute', 'value'])
@Index('idx_attributeproperty_attribute_value', ['attribute', 'value'])
export class AttributeProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Attribute, (attribute) => attribute.properties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attributeId', referencedColumnName: 'id' })
  attribute: Attribute;

  @Column({ nullable: true })
  value: string;

  @OneToMany(
    () => AttributePropNFTMapping,
    (attributePropNFTMapping) => attributePropNFTMapping.property,
    {
      onDelete: 'CASCADE',
    },
  )
  attributePropNFTMapping: AttributePropNFTMapping[];

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
