import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1690423095621 implements MigrationInterface {
    name = 'migrations1690423095621'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `blockNumber` CHANGE `isNFTCompletedUpdate` `isNFTCompletedUpdate` tinyint NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `blockNumber` CHANGE `isNFTCompletedUpdate` `isNFTCompletedUpdate` tinyint NOT NULL DEFAULT '1'");
    }

}
