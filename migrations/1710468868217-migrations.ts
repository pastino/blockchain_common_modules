import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1710468868217 implements MigrationInterface {
    name = 'migrations1710468868217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categoryContractMapping" ADD "categorySubId" bigint`);
        await queryRunner.query(`ALTER TABLE "categoryContractMapping" ADD CONSTRAINT "FK_d2ca4d8d6bde2169aa275c0cfa1" FOREIGN KEY ("categorySubId") REFERENCES "categorySub"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categoryContractMapping" DROP CONSTRAINT "FK_d2ca4d8d6bde2169aa275c0cfa1"`);
        await queryRunner.query(`ALTER TABLE "categoryContractMapping" DROP COLUMN "categorySubId"`);
    }

}
