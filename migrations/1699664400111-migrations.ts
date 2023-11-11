import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1699664400111 implements MigrationInterface {
    name = 'migrations1699664400111'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decodedLog" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "decodedLog" ADD "quantity" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decodedLog" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "decodedLog" ADD "quantity" integer`);
    }

}
