import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1700117156863 implements MigrationInterface {
    name = 'migrations1700117156863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_attribute_value" ON "attributeProperty" ("attributeId", "value") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_attributeproperty_attribute_value"`);
    }

}
