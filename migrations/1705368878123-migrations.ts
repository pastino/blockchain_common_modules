import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1705368878123 implements MigrationInterface {
    name = 'migrations1705368878123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_658371fb5f1fbab3418704462b7"`);
        await queryRunner.query(`DROP INDEX "idx_attributeproperty_nft_attribute_value"`);
        await queryRunner.query(`DROP INDEX "idx_attribute_property_nft"`);
        await queryRunner.query(`CREATE TABLE "attributePropNFTMapping" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "propertyId" integer, "nftId" integer, CONSTRAINT "PK_b633fac8238627bc1b23a9d1364" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_attribute_mapping_property" ON "attributePropNFTMapping" ("propertyId") `);
        await queryRunner.query(`CREATE INDEX "idx_attribute_mapping_nft" ON "attributePropNFTMapping" ("nftId") `);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP COLUMN "nftId"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "contractDetailId" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "UQ_df6f9c45ff54a962c9717a6f794" UNIQUE ("contractDetailId")`);
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_attribute_value" ON "attributeProperty" ("attributeId", "value") `);
        await queryRunner.query(`ALTER TABLE "attributePropNFTMapping" ADD CONSTRAINT "FK_77d080c8905feb0880016e90cc1" FOREIGN KEY ("propertyId") REFERENCES "attributeProperty"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attributePropNFTMapping" ADD CONSTRAINT "FK_bfec7890e548c4c5bc293636019" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "FK_df6f9c45ff54a962c9717a6f794" FOREIGN KEY ("contractDetailId") REFERENCES "contractDetail"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "FK_df6f9c45ff54a962c9717a6f794"`);
        await queryRunner.query(`ALTER TABLE "attributePropNFTMapping" DROP CONSTRAINT "FK_bfec7890e548c4c5bc293636019"`);
        await queryRunner.query(`ALTER TABLE "attributePropNFTMapping" DROP CONSTRAINT "FK_77d080c8905feb0880016e90cc1"`);
        await queryRunner.query(`DROP INDEX "idx_attributeproperty_attribute_value"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "UQ_df6f9c45ff54a962c9717a6f794"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "contractDetailId"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD "nftId" integer`);
        await queryRunner.query(`DROP INDEX "idx_attribute_mapping_nft"`);
        await queryRunner.query(`DROP INDEX "idx_attribute_mapping_property"`);
        await queryRunner.query(`DROP TABLE "attributePropNFTMapping"`);
        await queryRunner.query(`CREATE INDEX "idx_attribute_property_nft" ON "attributeProperty" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_nft_attribute_value" ON "attributeProperty" ("value", "attributeId", "nftId") `);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_658371fb5f1fbab3418704462b7" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
