import { ConnectionOptions } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ormconfig: ConnectionOptions = {
  type: "postgres",
  host: process.env.HOST,
  port: Number(process.env.POSTGRESQL_PORT),
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  // database: process.env.DATABASE,
  database: IS_PRODUCTION ? process.env.DATABASE : process.env.TEST_DATABASE,
  synchronize: false,
  // logging: ["warn", "error"],
  logging: [],
  // charset: "utf8mb4_unicode_ci",
  entities: [__dirname + "/entities/*.*"],
  migrations: [__dirname + "/migrations/*.*"],
  subscribers: [__dirname + "/subscribers/*.*"],
  extra: {
    connectionLimit: 10, // 연결 풀의 최대 연결 수
    waitForConnections: true, // 연결 풀이 연결을 대기할지 여부
  },
  ...(!isNestJs && {
    cli: {
      migrationsDir: "src/shared/migrations",
    },
  }),
};

export default ormconfig;
