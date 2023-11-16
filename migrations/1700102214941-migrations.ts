import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1700102214941 implements MigrationInterface {
    name = 'migrations1700102214941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD "nftId" integer`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_658371fb5f1fbab3418704462b7" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_658371fb5f1fbab3418704462b7"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP COLUMN "nftId"`);
    }

}
