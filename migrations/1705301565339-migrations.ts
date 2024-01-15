import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1705301565339 implements MigrationInterface {
    name = 'migrations1705301565339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "benefit" ("id" SERIAL NOT NULL, "benefit" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractDetailId" integer, CONSTRAINT "PK_c024dccb30e6f4702adffe884d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "loadmap" ("id" SERIAL NOT NULL, "loadmap" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractDetailId" integer, CONSTRAINT "PK_ed5516614ec6cf7d1633dc98451" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contractDetail" ("id" SERIAL NOT NULL, "detailDescription" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" integer, CONSTRAINT "REL_727ffa061c2fe8727c0971479f" UNIQUE ("contractId"), CONSTRAINT "PK_c8a2857b844d6d8cb9373b74f80" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "contractDetailId" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "UQ_df6f9c45ff54a962c9717a6f794" UNIQUE ("contractDetailId")`);
        await queryRunner.query(`ALTER TABLE "benefit" ADD CONSTRAINT "FK_9b9a4f919dd74175fb630f5e55a" FOREIGN KEY ("contractDetailId") REFERENCES "contractDetail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loadmap" ADD CONSTRAINT "FK_3ab92fd7d8bbd183931615f0a5b" FOREIGN KEY ("contractDetailId") REFERENCES "contractDetail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contractDetail" ADD CONSTRAINT "FK_727ffa061c2fe8727c0971479ff" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract" ADD CONSTRAINT "FK_df6f9c45ff54a962c9717a6f794" FOREIGN KEY ("contractDetailId") REFERENCES "contractDetail"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "FK_df6f9c45ff54a962c9717a6f794"`);
        await queryRunner.query(`ALTER TABLE "contractDetail" DROP CONSTRAINT "FK_727ffa061c2fe8727c0971479ff"`);
        await queryRunner.query(`ALTER TABLE "loadmap" DROP CONSTRAINT "FK_3ab92fd7d8bbd183931615f0a5b"`);
        await queryRunner.query(`ALTER TABLE "benefit" DROP CONSTRAINT "FK_9b9a4f919dd74175fb630f5e55a"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP CONSTRAINT "UQ_df6f9c45ff54a962c9717a6f794"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "contractDetailId"`);
        await queryRunner.query(`DROP TABLE "contractDetail"`);
        await queryRunner.query(`DROP TABLE "loadmap"`);
        await queryRunner.query(`DROP TABLE "benefit"`);
    }

}
