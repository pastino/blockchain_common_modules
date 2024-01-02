import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1704160863027 implements MigrationInterface {
    name = 'migrations1704160863027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_attributeproperty_attribute_value"`);
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_nft_attribute_value" ON "attributeProperty" ("nftId", "attributeId", "value") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_attributeproperty_nft_attribute_value"`);
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_attribute_value" ON "attributeProperty" ("value", "attributeId") `);
    }

}
