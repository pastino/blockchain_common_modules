import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1709453582657 implements MigrationInterface {
    name = 'migrations1709453582657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" ADD "errorMessage" character varying(1000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "errorMessage"`);
    }

}
