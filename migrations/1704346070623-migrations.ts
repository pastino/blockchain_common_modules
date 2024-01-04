import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1704346070623 implements MigrationInterface {
    name = 'migrations1704346070623'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "attributePropertyUnique" UNIQUE ("nftId", "attributeId", "value")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "attributePropertyUnique"`);
    }

}
