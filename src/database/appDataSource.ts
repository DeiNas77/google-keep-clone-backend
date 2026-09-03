import "reflect-metadata";
import { DataSource } from "typeorm";
import { dataSourceOptionsCommon } from "./databaseConfig.js";
import { Init1788395167311 } from "./migrations/1788395167311-init.js";

export const AppDataSource = new DataSource({
  ...dataSourceOptionsCommon,
  logging: false,
  migrations: [Init1788395167311],
});
