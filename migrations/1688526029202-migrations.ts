import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688526029202 implements MigrationInterface {
    name = 'migrations1688526029202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `idx_decodedlog_action` ON `decodedLog` (`action`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_decodedlog_action` ON `decodedLog`");
    }

}
