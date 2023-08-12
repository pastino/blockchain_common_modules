import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1691812185597 implements MigrationInterface {
    name = 'migrations1691812185597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "decodeError" ("id" SERIAL NOT NULL, "blockNumber" integer, "signature" character varying, "data" character varying, "log" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c533521ab03ca98b8eeffb5175b" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "decodeError"`);
    }

}
