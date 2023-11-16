import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1700105347477 implements MigrationInterface {
    name = 'migrations1700105347477'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attributeNFTMapping" ("nftId" integer NOT NULL, "attributePropertyId" integer NOT NULL, CONSTRAINT "PK_3f6b13778c80fdd3008406f5f82" PRIMARY KEY ("nftId", "attributePropertyId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5837706840e16dbd452ca4140f" ON "attributeNFTMapping" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0663e7c609898ca08f1b025812" ON "attributeNFTMapping" ("attributePropertyId") `);
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" ADD CONSTRAINT "FK_5837706840e16dbd452ca4140f0" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" ADD CONSTRAINT "FK_0663e7c609898ca08f1b025812c" FOREIGN KEY ("attributePropertyId") REFERENCES "attributeProperty"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" DROP CONSTRAINT "FK_0663e7c609898ca08f1b025812c"`);
        await queryRunner.query(`ALTER TABLE "attributeNFTMapping" DROP CONSTRAINT "FK_5837706840e16dbd452ca4140f0"`);
        await queryRunner.query(`DROP INDEX "IDX_0663e7c609898ca08f1b025812"`);
        await queryRunner.query(`DROP INDEX "IDX_5837706840e16dbd452ca4140f"`);
        await queryRunner.query(`DROP TABLE "attributeNFTMapping"`);
    }

}
