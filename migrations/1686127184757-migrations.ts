import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686127184757 implements MigrationInterface {
    name = 'migrations1686127184757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `decodedLog` ADD `gasUsed` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `decodedLog` ADD `cumulativeGasUsed` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `decodedLog` ADD `effectiveGasPrice` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `decodedLog` ADD `gasPrice` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `decodedLog` ADD `gasLimit` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `transaction` ADD `gasUsed` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `transaction` ADD `cumulativeGasUsed` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `transaction` ADD `effectiveGasPrice` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `transaction` DROP COLUMN `effectiveGasPrice`");
        await queryRunner.query("ALTER TABLE `transaction` DROP COLUMN `cumulativeGasUsed`");
        await queryRunner.query("ALTER TABLE `transaction` DROP COLUMN `gasUsed`");
        await queryRunner.query("ALTER TABLE `decodedLog` DROP COLUMN `gasLimit`");
        await queryRunner.query("ALTER TABLE `decodedLog` DROP COLUMN `gasPrice`");
        await queryRunner.query("ALTER TABLE `decodedLog` DROP COLUMN `effectiveGasPrice`");
        await queryRunner.query("ALTER TABLE `decodedLog` DROP COLUMN `cumulativeGasUsed`");
        await queryRunner.query("ALTER TABLE `decodedLog` DROP COLUMN `gasUsed`");
    }

}
