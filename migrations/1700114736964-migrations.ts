import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1700114736964 implements MigrationInterface {
    name = 'migrations1700114736964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attributeProperty" ("id" SERIAL NOT NULL, "value" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "attributeId" integer, CONSTRAINT "PK_30b7def1a023eb7efb59d450228" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attribute" ("id" SERIAL NOT NULL, "traitType" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" integer, CONSTRAINT "PK_b13fb7c5c9e9dff62b60e0de729" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attributeNFTMapping" ("nftId" integer NOT NULL, "attributePropertyId" integer NOT NULL, CONSTRAINT "PK_3f6b13778c80fdd3008406f5f82" PRIMARY KEY ("nftId", "attributePropertyId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5837706840e16dbd452ca4140f" ON "attributeNFTMapping" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0663e7c609898ca08f1b025812" ON "attributeNFTMapping" ("attributePropertyId") `);
        await queryRunner.query(`ALTER TABLE "nft" ADD "imageAlchemyUrl" character varying(1000)`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f" FOREIGN KEY ("attributeId") REFERENCES "attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attribute" ADD CONSTRAINT "FK_fbdac0db4ee7b67202ae2f52115" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" ADD CONSTRAINT "FK_5837706840e16dbd452ca4140f0" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" ADD CONSTRAINT "FK_0663e7c609898ca08f1b025812c" FOREIGN KEY ("attributePropertyId") REFERENCES "attributeProperty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" DROP CONSTRAINT "FK_0663e7c609898ca08f1b025812c"`);
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" DROP CONSTRAINT "FK_5837706840e16dbd452ca4140f0"`);
        await queryRunner.query(`ALTER TABLE "attribute" DROP CONSTRAINT "FK_fbdac0db4ee7b67202ae2f52115"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f"`);
        await queryRunner.query(`ALTER TABLE "nft" DROP COLUMN "imageAlchemyUrl"`);
        await queryRunner.query(`DROP INDEX "IDX_0663e7c609898ca08f1b025812"`);
        await queryRunner.query(`DROP INDEX "IDX_5837706840e16dbd452ca4140f"`);
        await queryRunner.query(`DROP TABLE "attributeNFTMapping"`);
        await queryRunner.query(`DROP TABLE "attribute"`);
        await queryRunner.query(`DROP TABLE "attributeProperty"`);
    }

}
