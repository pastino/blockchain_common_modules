import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1706235284507 implements MigrationInterface {
    name = 'migrations1706235284507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" ADD "attributeNetworkError" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "attributeNetworkError"`);
    }

}
