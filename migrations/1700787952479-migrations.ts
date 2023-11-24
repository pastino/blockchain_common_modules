import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1700787952479 implements MigrationInterface {
    name = 'migrations1700787952479'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" ADD "alchemyImageError" character varying(1000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "alchemyImageError"`);
    }

}
