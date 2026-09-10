import { verifyToken } from "../utils/auth.js";
import type { NextFunction, Request, Response } from "express";
import { GlobalRepository } from "../database/repositories/globalRepositories.js";
import type { AuthRequest } from "../types/AuthRequest.js";

async function verifyTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userRepository = GlobalRepository.UserRepository;
  try {
    const bearer = req.headers.authorization;
    const token = bearer?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Falta el token de autenticación",
      });
    }
    const decodeToken = verifyToken(token);
    const user = await userRepository.findOneBy({ id: decodeToken.id });
    if (!user)
      return res
        .status(401)
        .json({ message: "El usuario no existe o no pudo ser encontrado" });
    (req as AuthRequest).user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "No se pudo verificar el token de autenticación",
    });
  }
}

export { verifyTokenMiddleware };
