import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1705829976972 implements MigrationInterface {
    name = 'migrations1705829976972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributePropNFTMapping" ADD CONSTRAINT "attributePropNFTMappingUnique" UNIQUE ("propertyId", "nftId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributePropNFTMapping" DROP CONSTRAINT "attributePropNFTMappingUnique"`);
    }

}
