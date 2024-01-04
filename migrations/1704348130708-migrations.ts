import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1704348130708 implements MigrationInterface {
    name = 'migrations1704348130708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attribute" ADD CONSTRAINT "attributeUnique" UNIQUE ("contractId", "traitType")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attribute" DROP CONSTRAINT "attributeUnique"`);
    }

}
