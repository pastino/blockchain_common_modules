import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1691142174752 implements MigrationInterface {
    name = 'migrations1691142174752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageNumber"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageNumber" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageNumber"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageNumber" integer`);
    }

}
