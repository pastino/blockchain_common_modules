import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688352218833 implements MigrationInterface {
    name = 'migrations1688352218833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendCollection` CHANGE `timeRange` `timeRange` enum ('1H', '6H', '12H', '24H', '7D') NOT NULL");
        await queryRunner.query("CREATE INDEX `idx_trend_time_static` ON `trendCollection` (`timeRange`, `staticCreateAt`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_trend_time_static` ON `trendCollection`");
        await queryRunner.query("ALTER TABLE `trendCollection` CHANGE `timeRange` `timeRange` enum ('1H', '6H', '12H', '24H') NOT NULL");
    }

}
