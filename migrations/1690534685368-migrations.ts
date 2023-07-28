import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1690534685368 implements MigrationInterface {
    name = 'migrations1690534685368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD "contractId" integer`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD CONSTRAINT "UQ_0d4d7bde35689019f1b5b337f7f" UNIQUE ("contractId")`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD CONSTRAINT "FK_0d4d7bde35689019f1b5b337f7f" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP CONSTRAINT "FK_0d4d7bde35689019f1b5b337f7f"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP CONSTRAINT "UQ_0d4d7bde35689019f1b5b337f7f"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP COLUMN "contractId"`);
    }

}
