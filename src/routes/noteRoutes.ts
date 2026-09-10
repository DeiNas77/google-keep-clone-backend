import { Router } from "express";

/* Middlewares */
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

/* Controllers */
import {
  createNoteController,
  deleteNoteController,
  getNoteController,
  getStatsController,
  updateNoteController,
} from "../controllers/noteController.js";

export const notesRoutes = () => {
  const routerRoot = Router();
  routerRoot
    .route("/")
    .get([verifyTokenMiddleware], getNoteController)
    .post([verifyTokenMiddleware], createNoteController);

  // OJO: /stats SIEMPRE antes de /:id — si no, Express toma "stats" como un :id
  routerRoot.route("/stats").get([verifyTokenMiddleware], getStatsController);

  routerRoot
    .route("/:id")
    .patch([verifyTokenMiddleware], updateNoteController)
    .delete([verifyTokenMiddleware], deleteNoteController);

  return routerRoot;
};
