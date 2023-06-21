import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1687319839018 implements MigrationInterface {
    name = 'migrations1687319839018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingTwitter` DROP FOREIGN KEY `FK_4e219f94e1a7480b1a070375d38`");
        await queryRunner.query("ALTER TABLE `upcomingDiscord` DROP FOREIGN KEY `FK_570b09c73cc289fbf942d8057dc`");
        await queryRunner.query("ALTER TABLE `upcomingTwitter` ADD CONSTRAINT `FK_4e219f94e1a7480b1a070375d38` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `upcomingDiscord` ADD CONSTRAINT `FK_570b09c73cc289fbf942d8057dc` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upcomingDiscord` DROP FOREIGN KEY `FK_570b09c73cc289fbf942d8057dc`");
        await queryRunner.query("ALTER TABLE `upcomingTwitter` DROP FOREIGN KEY `FK_4e219f94e1a7480b1a070375d38`");
        await queryRunner.query("ALTER TABLE `upcomingDiscord` ADD CONSTRAINT `FK_570b09c73cc289fbf942d8057dc` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `upcomingTwitter` ADD CONSTRAINT `FK_4e219f94e1a7480b1a070375d38` FOREIGN KEY (`upcomingContractId`) REFERENCES `upcomingContract`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

}
