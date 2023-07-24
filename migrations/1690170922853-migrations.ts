import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1690170922853 implements MigrationInterface {
    name = 'migrations1690170922853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_decodedlog_eventTime` ON `decodedLog`");
        await queryRunner.query("DROP INDEX `IDX_dfcbf4069ec1d3ab1be0b38102` ON `log`");
        await queryRunner.query("CREATE TABLE `upcomingTwitter` (`id` int NOT NULL AUTO_INCREMENT, `followerCount` int NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `upcomingContractId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `upcomingDiscord` (`id` int NOT NULL AUTO_INCREMENT, `joinCount` int NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `upcomingContractId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `upcomingContract` (`id` int NOT NULL AUTO_INCREMENT, `publishDate` datetime NULL, `name` varchar(255) NULL, `category` varchar(255) NULL, `totalSupply` int NULL, `bannerImageUrl` varchar(255) NULL, `profileImageUrl` varchar(255) NULL, `description` longtext NULL, `externalUrl` varchar(255) NULL, `twitterUsername` varchar(255) NULL, `discordUrl` varchar(255) NULL, `premintUrl` varchar(255) NULL, `preSalePrice` float NULL, `publicSalePrice` float NULL, `tokenType` varchar(255) NULL DEFAULT 'ERC721', `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `trendUpcomingCollection` (`id` int NOT NULL AUTO_INCREMENT, `timeRange` enum ('1D', '3D', '7D', '14D') NOT NULL, `twitterFollowerCount` int NULL, `twitterDeviation` float NULL, `twitterDeviationPercent` float NULL, `discordJoinCount` int NULL, `discordDeviation` float NULL, `discordDeviationPercent` float NULL, `staticCreateAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `upcomingContractId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `nft` ADD `imageRoute` varchar(1000) NULL");
        await queryRunner.query("ALTER TABLE `nft` ADD `isImageUploaded` tinyint NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `salesDeviation` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `salesDeviationPercent` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `volumeDeviation` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `volumeDeviationPercent` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `averageValue` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `priceDeviation` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` ADD `priceDeviationPercent` float NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` CHANGE `timeRange` `timeRange` enum ('1H', '6H', '12H', '24H', '7D') NOT NULL");
        await queryRunner.query("CREATE INDEX `idx_topic_log_topic_index` ON `topic` (`logId`, `topic`, `index`)");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_contract` ON `decodedLog` (`contractId`)");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_action` ON `decodedLog` (`action`)");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_contractaddress_timestamp` ON `decodedLog` (`contractAddress`, `timestamp`)");
        await queryRunner.query("CREATE INDEX `idx_transaction_contract` ON `log` (`transactionId`, `contractId`)");
        await queryRunner.query("CREATE INDEX `idx_trend_time_static` ON `trendCollection` (`timeRange`, `staticCreateAt`)");
        await queryRunner.query("CREATE INDEX `idx_contract_openseaCollection` ON `contract` (`openseaCollectionId`)");
        await queryRunner.query("ALTER TABLE `upcomingTwitter` ADD CONSTRAINT `FK_4e219f94e1a7480b1a070375d38` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `upcomingDiscord` ADD CONSTRAINT `FK_570b09c73cc289fbf942d8057dc` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `trendUpcomingCollection` ADD CONSTRAINT `FK_50fda455816d9179571241b14f4` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendUpcomingCollection` DROP FOREIGN KEY `FK_50fda455816d9179571241b14f4`");
        await queryRunner.query("ALTER TABLE `upcomingDiscord` DROP FOREIGN KEY `FK_570b09c73cc289fbf942d8057dc`");
        await queryRunner.query("ALTER TABLE `upcomingTwitter` DROP FOREIGN KEY `FK_4e219f94e1a7480b1a070375d38`");
        await queryRunner.query("DROP INDEX `idx_contract_openseaCollection` ON `contract`");
        await queryRunner.query("DROP INDEX `idx_trend_time_static` ON `trendCollection`");
        await queryRunner.query("DROP INDEX `idx_transaction_contract` ON `log`");
        await queryRunner.query("DROP INDEX `idx_decodedlog_contractaddress_timestamp` ON `decodedLog`");
        await queryRunner.query("DROP INDEX `idx_decodedlog_action` ON `decodedLog`");
        await queryRunner.query("DROP INDEX `idx_decodedlog_contract` ON `decodedLog`");
        await queryRunner.query("DROP INDEX `idx_topic_log_topic_index` ON `topic`");
        await queryRunner.query("ALTER TABLE `trendCollection` CHANGE `timeRange` `timeRange` enum ('1H', '6H', '12H', '24H') NOT NULL");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `priceDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `priceDeviation`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `averageValue`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `volumeDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `volumeDeviation`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `salesDeviationPercent`");
        await queryRunner.query("ALTER TABLE `trendCollection` DROP COLUMN `salesDeviation`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `isImageUploaded`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `imageRoute`");
        await queryRunner.query("DROP TABLE `trendUpcomingCollection`");
        await queryRunner.query("DROP TABLE `upcomingContract`");
        await queryRunner.query("DROP TABLE `upcomingDiscord`");
        await queryRunner.query("DROP TABLE `upcomingTwitter`");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_dfcbf4069ec1d3ab1be0b38102` ON `log` (`decodedLogId`)");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_eventTime` ON `decodedLog` (`eventTime`)");
    }

}
