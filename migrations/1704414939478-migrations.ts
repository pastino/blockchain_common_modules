import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1704414939478 implements MigrationInterface {
    name = 'migrations1704414939478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attribute" DROP CONSTRAINT "FK_fbdac0db4ee7b67202ae2f52115"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attributeproperty_attribute_value"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD "nftId" integer`);
        await queryRunner.query(`CREATE INDEX "idx_decodedlog_nft" ON "decodedLog" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "idx_attribute_property_nft" ON "attributeProperty" ("nftId") `);
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_nft_attribute_value" ON "attributeProperty" ("nftId", "attributeId", "value") `);
        await queryRunner.query(`ALTER TABLE "attribute" ADD CONSTRAINT "attributeUnique" UNIQUE ("contractId", "traitType")`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "attributePropertyUnique" UNIQUE ("nftId", "attributeId", "value")`);
        await queryRunner.query(`ALTER TABLE "attribute" ADD CONSTRAINT "FK_fbdac0db4ee7b67202ae2f52115" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_658371fb5f1fbab3418704462b7" FOREIGN KEY ("nftId") REFERENCES "nft"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f" FOREIGN KEY ("attributeId") REFERENCES "attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_658371fb5f1fbab3418704462b7"`);
        await queryRunner.query(`ALTER TABLE "attribute" DROP CONSTRAINT "FK_fbdac0db4ee7b67202ae2f52115"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "attributePropertyUnique"`);
        await queryRunner.query(`ALTER TABLE "attribute" DROP CONSTRAINT "attributeUnique"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attributeproperty_nft_attribute_value"`);
        await queryRunner.query(`DROP INDEX "public"."idx_attribute_property_nft"`);
        await queryRunner.query(`DROP INDEX "public"."idx_decodedlog_nft"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP COLUMN "nftId"`);
        await queryRunner.query(`CREATE INDEX "idx_attributeproperty_attribute_value" ON "attributeProperty" ("value", "attributeId") `);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f" FOREIGN KEY ("attributeId") REFERENCES "attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attribute" ADD CONSTRAINT "FK_fbdac0db4ee7b67202ae2f52115" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
