import { DataSource } from "typeorm";
import { dataSourceOptionsCommon } from "./databaseConfig.js";

export const AppDataSource = new DataSource({
  ...dataSourceOptionsCommon,
  logging: false,
  migrations: [],
});
