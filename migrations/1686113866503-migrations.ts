import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686113866503 implements MigrationInterface {
    name = 'migrations1686113866503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `idx_decodedlog_contractAddress` ON `decodedLog` (`contractAddress`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_decodedlog_contractAddress` ON `decodedLog`");
    }

}
