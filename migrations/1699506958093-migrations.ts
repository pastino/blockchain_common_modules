import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699506958093 implements MigrationInterface {
    name = 'migrations1699506958093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_decodedlog_contract"`);
        await queryRunner.query(`DROP INDEX "idx_trend_time_contract"`);
        await queryRunner.query(`DROP INDEX "idx_opensea_collection_contract"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_opensea_collection_contract" ON "openseaCollection" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_trend_time_contract" ON "trendCollection" ("contractId") `);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_contract" ON "decodedLog" ("contractId") `);
    }

}
