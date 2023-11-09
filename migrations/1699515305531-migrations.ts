import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699515305531 implements MigrationInterface {
    name = 'migrations1699515305531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_decodedlog_contract"`);
        await queryRunner.query(`DROP INDEX "idx_trend_time_contract"`);
        await queryRunner.query(`DROP INDEX "idx_opensea_collection_contract"`);
        await queryRunner.query(`CREATE INDEX "idx_transaction_hash" ON "transaction" ("hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_transaction_hash"`);
        await queryRunner.query(`CREATE INDEX "idx_opensea_collection_contract" ON "openseaCollection" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_trend_time_contract" ON "trendCollection" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_contract" ON "decodedLog" ("contractId") `);
    }

}
