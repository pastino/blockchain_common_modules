import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1705215521062 implements MigrationInterface {
    name = 'migrations1705215521062'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_contract_action_timestamp_id" ON "decodedLog" ("contractId", "action", "timestamp", "id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_decodedlog_contract_action_timestamp_id"`);
    }

}
