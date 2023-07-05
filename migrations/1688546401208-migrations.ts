import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1688546401208 implements MigrationInterface {
    name = 'migrations1688546401208'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `trendUpcomingCollection` (`id` int NOT NULL AUTO_INCREMENT, `timeRange` enum ('1D', '3D', '7D', '14D') NOT NULL, `twitterFollowerCount` int NULL, `twitterDeviation` float NULL, `twitterDeviationPercent` float NULL, `discordJoinCount` int NULL, `discordDeviation` float NULL, `discordDeviationPercent` float NULL, `staticCreateAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `upcomingContractId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `trendUpcomingCollection` ADD CONSTRAINT `FK_50fda455816d9179571241b14f4` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendUpcomingCollection` DROP FOREIGN KEY `FK_50fda455816d9179571241b14f4`");
        await queryRunner.query("DROP TABLE `trendUpcomingCollection`");
    }

}
