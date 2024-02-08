import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1707377079489 implements MigrationInterface {
    name = 'migrations1707377079489'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" ADD "isUpdatedComplete" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "isUpdatedComplete"`);
    }

}
