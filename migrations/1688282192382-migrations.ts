import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688282192382 implements MigrationInterface {
    name = 'migrations1688282192382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `averageValue`");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `averageValue` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `priceDeviation`");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `priceDeviation` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `priceDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `priceDeviationPercent` float NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `priceDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `priceDeviationPercent` int NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `priceDeviation`");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `priceDeviation` int NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `averageValue`");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `averageValue` int NULL");
    }

}
