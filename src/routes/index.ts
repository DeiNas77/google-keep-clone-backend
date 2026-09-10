import type { Express } from "express";
import { Router } from "express";

/* Routes */
import { authRoutes } from "./authRoutes.js";
import { notesRoutes } from "./noteRoutes.js";

export const routes = (app: Express): Express => {
  const router = Router();

  router.use("/auth", authRoutes());
  router.use("/notes", notesRoutes());

  return app.use("/api/v1.0", router);
};
