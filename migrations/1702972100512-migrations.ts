import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1702972100512 implements MigrationInterface {
    name = 'migrations1702972100512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" ADD "createdDate" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "createdDate"`);
    }

}
