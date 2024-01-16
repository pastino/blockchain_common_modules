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
import { AttributeProperty } from './AttributeProperty';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

@Entity({ name: 'attributePropNFTMapping' })
@Index('idx_attribute_mapping_nft', ['nft'])
@Index('idx_attribute_mapping_property', ['property'])
export class AttributePropNFTMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => AttributeProperty,
    (property) => property.attributePropNFTMapping,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'propertyId', referencedColumnName: 'id' })
  property: AttributeProperty;

  @ManyToOne(() => NFT, (nft) => nft.attributePropNFTMappings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'nftId', referencedColumnName: 'id' })
  nft: NFT;

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
