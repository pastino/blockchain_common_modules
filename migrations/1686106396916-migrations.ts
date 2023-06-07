import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686106396916 implements MigrationInterface {
    name = 'migrations1686106396916'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `openseaCollection` DROP FOREIGN KEY `FK_0d4d7bde35689019f1b5b337f7f`");
        await queryRunner.query("DROP INDEX `IDX_0d4d7bde35689019f1b5b337f7` ON `openseaCollection`");
        await queryRunner.query("DROP INDEX `REL_0d4d7bde35689019f1b5b337f7` ON `openseaCollection`");
        await queryRunner.query("ALTER TABLE `openseaCollection` DROP COLUMN `contractId`");
        await queryRunner.query("CREATE INDEX `idx_address` ON `log` (`address`)");
        await queryRunner.query("CREATE INDEX `idx_contract` ON `log` (`contractId`)");
        await queryRunner.query("CREATE INDEX `idx_transaction` ON `log` (`transactionId`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `idx_transaction` ON `log`");
        await queryRunner.query("DROP INDEX `idx_contract` ON `log`");
        await queryRunner.query("DROP INDEX `idx_address` ON `log`");
        await queryRunner.query("ALTER TABLE `openseaCollection` ADD `contractId` int NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_0d4d7bde35689019f1b5b337f7` ON `openseaCollection` (`contractId`)");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_0d4d7bde35689019f1b5b337f7` ON `openseaCollection` (`contractId`)");
        await queryRunner.query("ALTER TABLE `openseaCollection` ADD CONSTRAINT `FK_0d4d7bde35689019f1b5b337f7f` FOREIGN KEY (`contractId`) REFERENCES `contract`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

}
