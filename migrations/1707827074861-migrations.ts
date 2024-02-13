import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1707827074861 implements MigrationInterface {
    name = 'migrations1707827074861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" ADD "imageAlchemyUrl" character varying(1000)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "imageAlchemyUrl"`);
    }

}
