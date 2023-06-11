import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686365203093 implements MigrationInterface {
    name = 'migrations1686365203093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `attributeNFT` (`id` int NOT NULL AUTO_INCREMENT, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `attributeId` int NULL, `nftId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `traitTypeContract` (`id` int NOT NULL AUTO_INCREMENT, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `traitTypeId` int NULL, `contractId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `traitType` (`id` int NOT NULL AUTO_INCREMENT, `traitType` varchar(255) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `attribute` (`id` int NOT NULL AUTO_INCREMENT, `value` varchar(255) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `traitTypeId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `nft` ADD `attributesRaw` longtext NULL");
        await queryRunner.query("ALTER TABLE `nft` ADD `imageRaw` longtext NULL");
        await queryRunner.query("ALTER TABLE `nft` ADD `imageFormat` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `nft` ADD `imageBytes` int NULL");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `rawMetadataImage`");
        await queryRunner.query("ALTER TABLE `nft` ADD `rawMetadataImage` longtext NULL");
        await queryRunner.query("CREATE INDEX `idx_decodedlog_contractAddress` ON `decodedLog` (`contractAddress`)");
        await queryRunner.query("ALTER TABLE `attributeNFT` ADD CONSTRAINT `FK_4c185918174b32df7ae6e15bcd5` FOREIGN KEY (`attributeId`) REFERENCES `attribute`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `attributeNFT` ADD CONSTRAINT `FK_25d2cd0fa65f6d692b88cc26875` FOREIGN KEY (`nftId`) REFERENCES `nft`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `traitTypeContract` ADD CONSTRAINT `FK_0004d7ddbd746932d4e086fd299` FOREIGN KEY (`traitTypeId`) REFERENCES `traitType`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `traitTypeContract` ADD CONSTRAINT `FK_26f2dc88214bdbfc59b18edd5b1` FOREIGN KEY (`contractId`) REFERENCES `contract`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `attribute` ADD CONSTRAINT `FK_efb565363ee98ee2eb280570688` FOREIGN KEY (`traitTypeId`) REFERENCES `traitType`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `attribute` DROP FOREIGN KEY `FK_efb565363ee98ee2eb280570688`");
        await queryRunner.query("ALTER TABLE `traitTypeContract` DROP FOREIGN KEY `FK_26f2dc88214bdbfc59b18edd5b1`");
        await queryRunner.query("ALTER TABLE `traitTypeContract` DROP FOREIGN KEY `FK_0004d7ddbd746932d4e086fd299`");
        await queryRunner.query("ALTER TABLE `attributeNFT` DROP FOREIGN KEY `FK_25d2cd0fa65f6d692b88cc26875`");
        await queryRunner.query("ALTER TABLE `attributeNFT` DROP FOREIGN KEY `FK_4c185918174b32df7ae6e15bcd5`");
        await queryRunner.query("DROP INDEX `idx_decodedlog_contractAddress` ON `decodedLog`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `rawMetadataImage`");
        await queryRunner.query("ALTER TABLE `nft` ADD `rawMetadataImage` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `imageBytes`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `imageFormat`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `imageRaw`");
        await queryRunner.query("ALTER TABLE `nft` DROP COLUMN `attributesRaw`");
        await queryRunner.query("DROP TABLE `attribute`");
        await queryRunner.query("DROP TABLE `traitType`");
        await queryRunner.query("DROP TABLE `traitTypeContract`");
        await queryRunner.query("DROP TABLE `attributeNFT`");
    }

}
