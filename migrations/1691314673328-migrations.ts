import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1691314673328 implements MigrationInterface {
    name = 'migrations1691314673328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageNumber"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageNumber" integer DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageNumber"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageNumber" character varying`);
    }

}
