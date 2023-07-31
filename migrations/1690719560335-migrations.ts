import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1690719560335 implements MigrationInterface {
    name = 'migrations1690719560335'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" ADD "alchemyCollectionError" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "alchemyCollectionError"`);
    }

}
