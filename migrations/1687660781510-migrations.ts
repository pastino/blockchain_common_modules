import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIndexOnDecodedLogTimestampDESC1622810292473
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IDX_DECODEDLOG_TIMESTAMP_DESC ON \`decodedLog\` (\`timestamp\` DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_DECODEDLOG_TIMESTAMP_DESC`);
  }
}
