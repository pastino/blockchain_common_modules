import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1685873144309 implements MigrationInterface {
    name = 'migrations1685873144309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `trendCollections` (`id` int NOT NULL AUTO_INCREMENT, `floorPrice` float NULL, `volume` float NULL, `timeRange` enum ('1H', '6H', '12H', '24H') NOT NULL, `sales` int NULL, `staticCreateAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `contractId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `trendCollections` ADD CONSTRAINT `FK_0cdcb00e7c8521f583e5478bbd9` FOREIGN KEY (`contractId`) REFERENCES `contract`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `trendCollections` DROP FOREIGN KEY `FK_0cdcb00e7c8521f583e5478bbd9`");
        await queryRunner.query("DROP TABLE `trendCollections`");
    }

}
