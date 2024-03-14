import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1710402181788 implements MigrationInterface {
    name = 'migrations1710402181788'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "imageUrl" text`);
        await queryRunner.query(`ALTER TABLE "categorySub" ADD "imageUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categorySub" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "imageUrl"`);
    }

}
