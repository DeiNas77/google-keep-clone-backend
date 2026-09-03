import type { DataSourceOptions } from "typeorm";
import { DB } from "../constants.js";
//Entities
import { UserEntity } from "./entities/User.js";
import { NoteEntity } from "./entities/Note.js";

const databaseConfig: DataSourceOptions = {
  type: "postgres",
  host: DB.host,
  port: DB.port,
  username: DB.user,
  password: DB.password,
  database: DB.database,
  logging: true,
};

export const dataSourceOptionsCommon: DataSourceOptions = {
  ...databaseConfig,
  entities: [UserEntity, NoteEntity],
};
