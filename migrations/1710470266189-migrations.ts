import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1710470266189 implements MigrationInterface {
    name = 'migrations1710470266189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brand" ADD "imageUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "brand" DROP COLUMN "imageUrl"`);
    }

}
