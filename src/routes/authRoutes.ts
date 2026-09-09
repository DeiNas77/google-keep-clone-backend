import { Router } from "express";
import {
  getMeController,
  loginController,
  registerController,
} from "../controllers/authController.js";
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

export const authRoutes = () => {
  const routerRoot = Router();
  //Register
  routerRoot.post("/register", registerController);
  //Me
  routerRoot.route("/me").get([verifyTokenMiddleware], getMeController);
  //Login
  routerRoot.post("/login", loginController);
  return routerRoot;
};
