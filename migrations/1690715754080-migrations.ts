import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1690715754080 implements MigrationInterface {
    name = 'migrations1690715754080'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "traitTypeContract" DROP CONSTRAINT "FK_26f2dc88214bdbfc59b18edd5b1"`);
        await queryRunner.query(`ALTER TABLE "traitTypeContract" DROP CONSTRAINT "FK_0004d7ddbd746932d4e086fd299"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD "totalSupply" integer`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" ADD "count" integer`);
        await queryRunner.query(`ALTER TABLE "contract" ADD "isNFTsCreated" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "traitTypeContract" ADD CONSTRAINT "FK_0004d7ddbd746932d4e086fd299" FOREIGN KEY ("traitTypeId") REFERENCES "traitType"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "traitTypeContract" ADD CONSTRAINT "FK_26f2dc88214bdbfc59b18edd5b1" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "traitTypeContract" DROP CONSTRAINT "FK_26f2dc88214bdbfc59b18edd5b1"`);
        await queryRunner.query(`ALTER TABLE "traitTypeContract" DROP CONSTRAINT "FK_0004d7ddbd746932d4e086fd299"`);
        await queryRunner.query(`ALTER TABLE "contract" DROP COLUMN "isNFTsCreated"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP COLUMN "count"`);
        await queryRunner.query(`ALTER TABLE "openseaCollection" DROP COLUMN "totalSupply"`);
        await queryRunner.query(`ALTER TABLE "traitTypeContract" ADD CONSTRAINT "FK_0004d7ddbd746932d4e086fd299" FOREIGN KEY ("traitTypeId") REFERENCES "traitType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "traitTypeContract" ADD CONSTRAINT "FK_26f2dc88214bdbfc59b18edd5b1" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
