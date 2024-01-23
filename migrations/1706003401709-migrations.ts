import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1706003401709 implements MigrationInterface {
    name = 'migrations1706003401709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upcomingContract" ADD "isPublished" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "upcomingContract" ADD "contractAddress" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upcomingContract" DROP COLUMN "contractAddress"`);
        await queryRunner.query(`ALTER TABLE "upcomingContract" DROP COLUMN "isPublished"`);
    }

}
