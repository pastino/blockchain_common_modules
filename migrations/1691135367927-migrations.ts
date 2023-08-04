import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1691135367927 implements MigrationInterface {
    name = 'migrations1691135367927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageNumber" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageKey" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageKey"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageNumber"`);
    }

}
