import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686111485317 implements MigrationInterface {
    name = 'migrations1686111485317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `idx_transaction` ON `decodedLog` (`transactionId`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_transaction` ON `decodedLog`");
    }

}
