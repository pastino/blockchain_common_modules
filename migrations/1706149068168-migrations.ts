import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1706149068168 implements MigrationInterface {
    name = 'migrations1706149068168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upcomingContract" ADD "isRecommend" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upcomingContract" DROP COLUMN "isRecommend"`);
    }

}
