import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1705279414439 implements MigrationInterface {
    name = 'migrations1705279414439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "idx_nft_id_isAttributeUpdated" ON "nft" ("id", "isAttributeUpdated") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_nft_id_isAttributeUpdated"`);
    }

}
