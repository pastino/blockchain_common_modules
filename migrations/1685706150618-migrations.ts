import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1685706150618 implements MigrationInterface {
    name = 'migrations1685706150618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `openseaCollection` DROP COLUMN `contractId`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `openseaCollection` ADD `contractId` int NULL");
    }

}
