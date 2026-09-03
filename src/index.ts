import type { Express } from "express";

import { AppDataSource } from "./database/appDataSource.js";

async function main() {
  try {
    await AppDataSource.initialize();
    const imported = await import("./app.js");
    const app = imported.default as Express;
    const port: number = app.get("port") as number;

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log(error, "error initializing the app");
    process.exit(1);
  }
}

void main();
