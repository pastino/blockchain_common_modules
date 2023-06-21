import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687342473235 implements MigrationInterface {
    name = 'migrations1687342473235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `category` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `category`");
    }

}
