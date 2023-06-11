import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686452178445 implements MigrationInterface {
    name = 'migrations1686452178445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `nft` ADD `isAttributeUpdated` tinyint NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `isAttributeUpdated`");
    }

}
