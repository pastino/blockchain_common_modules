import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699514057443 implements MigrationInterface {
    name = 'migrations1699514057443'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "imageBytes"`);
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "imageFormat"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "isNFTsCreated"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "nftProgressStatus"`);
        await queryRunner.query(`DROP TYPE "public"."contract_nftprogressstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageNumber"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdNFTsPageKey"`);
        await queryRunner.query(`CREATE INDEX "idx_transaction_contract" ON "transaction" ("contractId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_transaction_contract"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageKey" character varying`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdNFTsPageNumber" integer DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."contract_nftprogressstatus_enum" AS ENUM('not_started', 'in_progress', 'completed', 'aborted')`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "nftProgressStatus" "contract_nftprogressstatus_enum" NOT NULL DEFAULT 'not_started'`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "isNFTsCreated" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "imageFormat" character varying`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "imageBytes" integer`);
    }

}
