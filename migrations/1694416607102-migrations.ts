import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1694416607102 implements MigrationInterface {
    name = 'migrations1694416607102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upcomingContract" DROP COLUMN "totalSupply"`);
        await queryRunner.query(`ALTER TABLE "upcomingContract" ADD "totalSupply" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "upcomingContract" DROP COLUMN "totalSupply"`);
        await queryRunner.query(`ALTER TABLE "upcomingContract" ADD "totalSupply" integer`);
    }

}
