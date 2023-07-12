import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1689149270171 implements MigrationInterface {
    name = 'migrations1689149270171'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `nft` ADD `imageRoute` varchar(1000) NULL");
        await queryRunner.query("ALTER TABLE `nft` ADD `isImageUploaded` tinyint NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `isImageUploaded`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `imageRoute`");
    }

}
