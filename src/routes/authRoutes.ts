import { Router } from "express";
import {
  loginController,
  registerController,
} from "../controllers/authController.js";

export const authRoutes = () => {
  const routerRoot = Router();
  //Register
  routerRoot.post("/register", registerController);
  //Login
  routerRoot.post("/login", loginController);
  return routerRoot;
};
