import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688517868039 implements MigrationInterface {
    name = 'migrations1688517868039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `idx_transaction_contract` ON `log` (`transactionId`, `contractId`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_transaction_contract` ON `log`");
    }

}
