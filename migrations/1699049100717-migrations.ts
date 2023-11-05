import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699049100717 implements MigrationInterface {
    name = 'migrations1699049100717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "mediaThumbnail"`);
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "rawMetadataImage"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" ADD "rawMetadataImage" text`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "mediaThumbnail" character varying`);
    }

}
