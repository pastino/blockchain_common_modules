import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687660781510 implements MigrationInterface {
    name = 'migrations1687660781510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `preSalePrice`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `preSalePrice` float NULL");
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `publicSalePrice`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `publicSalePrice` float NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `publicSalePrice`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `publicSalePrice` int NULL");
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `preSalePrice`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `preSalePrice` int NULL");
    }

}
