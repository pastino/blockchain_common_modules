import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688197716047 implements MigrationInterface {
    name = 'migrations1688197716047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_decodedlog_eventTime` ON `decodedLog`");
        await queryRunner.query("DROP INDEX `idx_decodedlog_timestamp` ON `decodedLog`");
        await queryRunner.query("DROP INDEX `IDX_DECODEDLOG_TIMESTAMP_DESC` ON `decodedLog`");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_contractaddress_timestamp` ON `decodedLog` (`contractAddress`, `timestamp`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_decodedlog_contractaddress_timestamp` ON `decodedLog`");
        await queryRunner.query("CREATE INDEX `IDX_DECODEDLOG_TIMESTAMP_DESC` ON `decodedLog` (`timestamp`)");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_timestamp` ON `decodedLog` (`timestamp`)");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_eventTime` ON `decodedLog` (`eventTime`)");
    }

}
