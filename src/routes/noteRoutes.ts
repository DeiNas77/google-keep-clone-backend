import { Router } from "express";

/* Middlewares */
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

/* Controllers */
import {
  createNoteController,
  deleteNoteController,
  getNoteController,
  updateNoteController,
} from "../controllers/noteController.js";

export const notesRoutes = () => {
  const routerRoot = Router();
  routerRoot
    .route("/")
    .get([verifyTokenMiddleware], getNoteController)
    .post([verifyTokenMiddleware], createNoteController);

  routerRoot
    .route("/:id")
    .patch([verifyTokenMiddleware], updateNoteController)
    .delete([verifyTokenMiddleware], deleteNoteController);

  return routerRoot;
};
