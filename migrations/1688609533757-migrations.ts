import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688609533757 implements MigrationInterface {
    name = 'migrations1688609533757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `salesDeviation` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `salesDeviationPercent` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `volumeDeviation` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `volumeDeviationPercent` float NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `volumeDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `volumeDeviation`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `salesDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `salesDeviation`");
    }

}
