import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import * as dotenv from 'dotenv';
import { Contract } from './Contract';
import { AttributeProperty } from './AttributeProperty';
import { attributeExample } from '../entityExamples';

dotenv.config({ path: __dirname + '/../../../.env.dev' });
const isNestJs = process.env.APP_TYPE === 'nestjs';

const ApiProperty = isNestJs
  ? require('@nestjs/swagger').ApiProperty
  : () => {};

@Entity({ name: 'attribute' })
@Unique('attributeUnique', ['contract', 'traitType'])
@Index('idx_attribute_contract', ['contract'])
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Contract, (contract) => contract.nfts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contractId', referencedColumnName: 'id' })
  contract: Contract;

  @Column({ nullable: true })
  traitType: string;

  @OneToMany(
    () => AttributeProperty,
    (attributeProperty) => attributeProperty.attribute,
    {
      onDelete: 'CASCADE',
    },
  )
  properties: AttributeProperty[];

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  static example(): Attribute {
    const instance: any = new Attribute();

    for (let key in attributeExample) {
      instance[key] = attributeExample[key];
    }

    return instance;
  }
}

if (isNestJs) {
  const { id, contract, traitType, properties, createdAt, updatedAt } =
    attributeExample;

  const propertyDecorators = [
    ApiProperty({
      name: 'id',
      type: Number,
      example: id,
      description: 'Uniqe ID',
    }),
    ApiProperty({
      name: 'contract',
      type: () => Contract,
      example: contract,
      description: '컬랙션 데이터',
    }),
    ApiProperty({
      name: 'traitType',
      type: String,
      example: traitType,
      description: '속성 타입',
    }),
    ApiProperty({
      name: 'properties',
      type: () => [AttributeProperty],
      example: properties,
      description: '속성 데이터',
    }),
    ApiProperty({
      name: 'createdAt',
      type: Date,
      example: createdAt,
      description: '생성된 시간',
    }),
    ApiProperty({
      name: 'updatedAt',
      type: Date,
      example: updatedAt,
      description: '업데이트된 시간',
    }),
  ];

  propertyDecorators.forEach((decorator, index) => {
    decorator(Attribute.prototype, index.toString());
  });
}
