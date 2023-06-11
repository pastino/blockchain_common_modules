import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686453975665 implements MigrationInterface {
    name = 'migrations1686453975665'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `nft` ADD `isAttributeUpdated` tinyint NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `isAttributeUpdated`");
    }

}
