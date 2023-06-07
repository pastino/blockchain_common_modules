import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686108917355 implements MigrationInterface {
    name = 'migrations1686108917355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `idx_transaction_timestamp` ON `transaction` (`timestamp`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_transaction_timestamp` ON `transaction`");
    }

}
