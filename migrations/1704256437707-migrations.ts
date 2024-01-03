import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1704256437707 implements MigrationInterface {
    name = 'migrations1704256437707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f" FOREIGN KEY ("attributeId") REFERENCES "attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attributeProperty" DROP CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f"`);
        await queryRunner.query(`ALTER TABLE "attributeProperty" ADD CONSTRAINT "FK_c26169020b3bfc146d3ee685c0f" FOREIGN KEY ("attributeId") REFERENCES "attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
