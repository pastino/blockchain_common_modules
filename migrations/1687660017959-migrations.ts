import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687660017959 implements MigrationInterface {
    name = 'migrations1687660017959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` ADD `mintPrice` int NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingContract` DROP COLUMN `mintPrice`");
    }

}
