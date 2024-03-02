import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1709082878672 implements MigrationInterface {
    name = 'migrations1709082878672'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_log_transaction" ON "log" ("transactionId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_log_transaction"`);
    }

}
