import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687251191516 implements MigrationInterface {
    name = 'migrations1687251191516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `premintUrl` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `totalSupply`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `totalSupply` int NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `totalSupply`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `totalSupply` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `premintUrl`");
    }

}
