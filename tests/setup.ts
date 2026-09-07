import "reflect-metadata";
import { afterAll, afterEach } from "vitest";
import { AppDataSource } from "../src/database/appDataSource.js";
import { buildRepositories } from "../src/database/repositories/globalRepositories.js";

// CRÍTICO: esto DEBE correr antes de que cualquier test importe app.js.
// Los controllers capturan GlobalRepository.* en el import, no en el request.
// (igual que index.ts hace buildRepositories BEFORE import("./app.js"))
await AppDataSource.initialize();
await AppDataSource.runMigrations();
buildRepositories(AppDataSource);

afterEach(async () => {
  await AppDataSource.query(`TRUNCATE "users", "notes" CASCADE`);
});

afterAll(async () => {
  await AppDataSource.destroy();
});
