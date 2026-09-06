import { Router } from "express";
import {
  createNoteController,
  getNoteController,
} from "../controllers/noteController.js";
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

export const notesRoutes = () => {
  const routerRoot = Router();
  routerRoot
    .route("/")
    .get([verifyTokenMiddleware], getNoteController)
    .post([verifyTokenMiddleware], createNoteController);

  return routerRoot;
};
