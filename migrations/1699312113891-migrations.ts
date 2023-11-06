import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699312113891 implements MigrationInterface {
    name = 'migrations1699312113891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "imageBytes"`);
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "imageFormat"`);
        await queryRunner.query(`CREATE INDEX "idx_log_nft" ON "log" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "idx_log_contract" ON "log" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_nft_contract" ON "nft" ("contractId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_nft_contract"`);
        await queryRunner.query(`DROP INDEX "idx_log_contract"`);
        await queryRunner.query(`DROP INDEX "idx_log_nft"`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "imageFormat" character varying`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "imageBytes" integer`);
    }

}
