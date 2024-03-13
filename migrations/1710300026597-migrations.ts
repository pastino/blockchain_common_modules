import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1710300026597 implements MigrationInterface {
    name = 'migrations1710300026597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "contractContractMapping" ("id" BIGSERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" bigint, "contractItemId" bigint, CONSTRAINT "PK_4c894eed8d53b884d90a48d6535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "contractContractMapping" ADD CONSTRAINT "FK_a6aa874c4f201fa030acf6a76d2" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contractContractMapping" ADD CONSTRAINT "FK_760f5b4808b8a8d42908b687b53" FOREIGN KEY ("contractItemId") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contractContractMapping" DROP CONSTRAINT "FK_760f5b4808b8a8d42908b687b53"`);
        await queryRunner.query(`ALTER TABLE "contractContractMapping" DROP CONSTRAINT "FK_a6aa874c4f201fa030acf6a76d2"`);
        await queryRunner.query(`DROP TABLE "contractContractMapping"`);
    }

}
