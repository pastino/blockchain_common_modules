import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687316797696 implements MigrationInterface {
    name = 'migrations1687316797696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `imageUrl`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `bannerImageUrl` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `profileImageUrl` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `profileImageUrl`");
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `bannerImageUrl`");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `imageUrl` varchar(255) NULL");
    }

}
