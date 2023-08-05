import {MigrationInterface, QueryRunner} from "typeorm";

export class migrations1691200672349 implements MigrationInterface {
    name = 'migrations1691200672349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "contract_nftprogressstatus_enum" RENAME TO "contract_nftprogressstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "contract_nftprogressstatus_enum" AS ENUM('not_started', 'in_progress', 'completed', 'aborted')`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "nftProgressStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "nftProgressStatus" TYPE "contract_nftprogressstatus_enum" USING "nftProgressStatus"::"text"::"contract_nftprogressstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "nftProgressStatus" SET DEFAULT 'not_started'`);
        await queryRunner.query(`DROP TYPE "contract_nftprogressstatus_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "contract_nftprogressstatus_enum_old" AS ENUM('not_started', 'in_progress', 'completed')`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "nftProgressStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "nftProgressStatus" TYPE "contract_nftprogressstatus_enum_old" USING "nftProgressStatus"::"text"::"contract_nftprogressstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "contract" ALTER COLUMN "nftProgressStatus" SET DEFAULT 'not_started'`);
        await queryRunner.query(`DROP TYPE "contract_nftprogressstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "contract_nftprogressstatus_enum_old" RENAME TO "contract_nftprogressstatus_enum"`);
    }

}
