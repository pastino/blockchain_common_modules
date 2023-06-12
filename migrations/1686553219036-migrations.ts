import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1686553219036 implements MigrationInterface {
    name = 'migrations1686553219036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_dfcbf4069ec1d3ab1be0b38102` ON `log`");
        await queryRunner.query("ALTER TABLE `log` ADD CONSTRAINT `FK_dfcbf4069ec1d3ab1be0b381021` FOREIGN KEY (`decodedLogId`) REFERENCES `decodedLog`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `log` DROP FOREIGN KEY `FK_dfcbf4069ec1d3ab1be0b381021`");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_dfcbf4069ec1d3ab1be0b38102` ON `log` (`decodedLogId`)");
    }

}
