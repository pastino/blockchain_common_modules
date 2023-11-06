import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699274200158 implements MigrationInterface {
    name = 'migrations1699274200158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decodedLog" DROP CONSTRAINT "FK_c05c68da29114e359592d6e34cf"`);
        await queryRunner.query(`ALTER TABLE "decodedLog" DROP CONSTRAINT "FK_d88eb3cbdbb03a4bc4df900baa3"`);
        await queryRunner.query(`DROP INDEX "idx_topic_index"`);
        await queryRunner.query(`DROP INDEX "idx_topic_topic"`);
        await queryRunner.query(`DROP INDEX "idx_decodedlog_contract"`);
        await queryRunner.query(`DROP INDEX "idx_decodedlog_timestamp"`);
        await queryRunner.query(`DROP INDEX "idx_decodedlog_action"`);
        await queryRunner.query(`DROP INDEX "idx_decodedlog_contractAddress"`);
        await queryRunner.query(`DROP INDEX "idx_address"`);
        await queryRunner.query(`DROP INDEX "idx_contract"`);
        await queryRunner.query(`DROP INDEX "idx_transaction"`);
        await queryRunner.query(`DROP INDEX "idx_transactionIndex"`);
        await queryRunner.query(`DROP INDEX "idx_transaction_contract"`);
        await queryRunner.query(`DROP INDEX "idx_contract_address"`);
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "confirmations"`);
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "mediaThumbnail"`);
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "rawMetadataImage"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "isSpam"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "alchemyCollectionError"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "tokenId"`);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_log" ON "decodedLog" ("logId") `);
        await queryRunner.query(`CREATE INDEX "idx_transaction_blockNumber" ON "transaction" ("blockNumberId") `);
        await queryRunner.query(`CREATE INDEX "idx_log_nft" ON "log" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "idx_log_contract" ON "log" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_log_decodedLog" ON "log" ("decodedLogId") `);
        await queryRunner.query(`CREATE INDEX "idx_log_transaction_contract" ON "log" ("transactionId", "contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_attributeNFT_attribute" ON "attributeNFT" ("attributeId") `);
        await queryRunner.query(`CREATE INDEX "idx_attributeNFT_nft" ON "attributeNFT" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "idx_nft_contract" ON "nft" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_traitType_contract" ON "traitTypeContract" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_traitTypeContract_traitType" ON "traitTypeContract" ("traitTypeId") `);
        await queryRunner.query(`ALTER TABLE "decodedLog" ADD CONSTRAINT "FK_c05c68da29114e359592d6e34cf" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "decodedLog" ADD CONSTRAINT "FK_d88eb3cbdbb03a4bc4df900baa3" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decodedLog" DROP CONSTRAINT "FK_d88eb3cbdbb03a4bc4df900baa3"`);
        await queryRunner.query(`ALTER TABLE "decodedLog" DROP CONSTRAINT "FK_c05c68da29114e359592d6e34cf"`);
        await queryRunner.query(`DROP INDEX "idx_traitTypeContract_traitType"`);
        await queryRunner.query(`DROP INDEX "idx_traitType_contract"`);
        await queryRunner.query(`DROP INDEX "idx_nft_contract"`);
        await queryRunner.query(`DROP INDEX "idx_attributeNFT_nft"`);
        await queryRunner.query(`DROP INDEX "idx_attributeNFT_attribute"`);
        await queryRunner.query(`DROP INDEX "idx_log_transaction_contract"`);
        await queryRunner.query(`DROP INDEX "idx_log_decodedLog"`);
        await queryRunner.query(`DROP INDEX "idx_log_contract"`);
        await queryRunner.query(`DROP INDEX "idx_log_nft"`);
        await queryRunner.query(`DROP INDEX "idx_transaction_blockNumber"`);
        await queryRunner.query(`DROP INDEX "idx_decodedlog_log"`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "tokenId" character varying`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "alchemyCollectionError" text`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "isSpam" boolean`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "rawMetadataImage" text`);
        await queryRunner.query(`ALTER TABLE "nft" ADD "mediaThumbnail" character varying`);
        await queryRunner.query(`ALTER TABLE "transaction" ADD "confirmations" integer`);
        await queryRunner.query(`CREATE INDEX "idx_contract_address" ON "contract" ("address") `);
        await queryRunner.query(`CREATE INDEX "idx_transaction_contract" ON "log" ("transactionId", "contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_transactionIndex" ON "log" ("transactionIndex") `);
        await queryRunner.query(`CREATE INDEX "idx_transaction" ON "log" ("transactionId") `);
        await queryRunner.query(`CREATE INDEX "idx_contract" ON "log" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_address" ON "log" ("address") `);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_contractAddress" ON "decodedLog" ("contractAddress") `);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_action" ON "decodedLog" ("action") `);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_timestamp" ON "decodedLog" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_contract" ON "decodedLog" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_topic_topic" ON "topic" ("topic") `);
        await queryRunner.query(`CREATE INDEX "idx_topic_index" ON "topic" ("index") `);
        await queryRunner.query(`ALTER TABLE "decodedLog" ADD CONSTRAINT "FK_d88eb3cbdbb03a4bc4df900baa3" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "decodedLog" ADD CONSTRAINT "FK_c05c68da29114e359592d6e34cf" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
