import { Router } from "express";
import {
  getMeController,
  loginController,
  registerController,
  updatePasswordProfileController,
  updateProfileController,
} from "../controllers/authController.js";
import { verifyTokenMiddleware } from "../middlewares/authMiddleware.js";

export const authRoutes = () => {
  const routerRoot = Router();
  //Register
  routerRoot.post("/register", registerController);
  //Login
  routerRoot.post("/login", loginController);
  //Me
  routerRoot.route("/me").get([verifyTokenMiddleware], getMeController);
  //Update username profile
  routerRoot
    .route("/update-username-profile")
    .patch([verifyTokenMiddleware], updateProfileController);
  //Update password profile
  routerRoot
    .route("/update-password-profile")
    .patch([verifyTokenMiddleware], updatePasswordProfileController);
  return routerRoot;
};
