import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686115751772 implements MigrationInterface {
    name = 'migrations1686115751772'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `idx_transactionIndex` ON `log` (`transactionIndex`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_transactionIndex` ON `log`");
    }

}
