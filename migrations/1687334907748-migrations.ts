import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687334907748 implements MigrationInterface {
    name = 'migrations1687334907748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `symbol`");
        await queryRunner.query("ALTER TABLE `upcomingContract` CHANGE `tokenType` `tokenType` varchar(255) NULL DEFAULT 'ERC721'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` CHANGE `tokenType` `tokenType` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `symbol` varchar(255) NULL");
    }

}
