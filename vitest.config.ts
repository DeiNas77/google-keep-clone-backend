import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Apunta a la BD de test SIN tocar el .env de desarrollo
    env: {
      DB_NAME: "google_keep_clone_test",
    },
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // Los tests comparten UNA BD — deben correr en serie o se pisan con TRUNCATE
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});