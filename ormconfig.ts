import { ConnectionOptions } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../../.env.dev" });
const isNestJs = process.env.APP_TYPE === "nestjs";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ormconfig: ConnectionOptions = {
  type: "mysql",
  host: process.env.HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  // database: process.env.DATABASE,
  database: IS_PRODUCTION ? process.env.DATABASE : process.env.TEST_DATABASE,
  synchronize: false,
  logging: ["warn", "error"],
  charset: "utf8mb4_unicode_ci",
  entities: [__dirname + "/entities/*.*"],
  migrations: [__dirname + "/migrations/*.*"],
  subscribers: [__dirname + "/subscribers/*.*"],
  extra: {},
  timezone: "Z",
  ...(!isNestJs && {
    cli: {
      migrationsDir: "src/shared/migrations",
    },
  }),
};

export default ormconfig;
