import "reflect-metadata";
import { DataSource } from "typeorm";
import { dataSourceOptionsCommon } from "./databaseConfig.js";
import { Init1788487593601 } from "./migrations/1788487593601-init.js";

export const AppDataSource = new DataSource({
  ...dataSourceOptionsCommon,
  logging: false,
  migrations: [Init1788487593601],
});
