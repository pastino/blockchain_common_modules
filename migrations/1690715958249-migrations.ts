import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1690715958249 implements MigrationInterface {
    name = 'migrations1690715958249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD "totalSupply" integer`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD "count" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "isNFTsCreated" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "isNFTsCreated"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP COLUMN "count"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP COLUMN "totalSupply"`);
    }

}
