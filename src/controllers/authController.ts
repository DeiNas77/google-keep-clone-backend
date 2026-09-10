import type { Request, Response } from "express";
import { z } from "zod";
import { GlobalRepository } from "../database/repositories/globalRepositories.js";
import {
  loginSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "../schemas/authSchema.js";
import { comparePassword, createToken, hashPassword } from "../utils/auth.js";
import type { AuthRequest } from "../types/AuthRequest.js";

const userRepository = GlobalRepository.UserRepository;

export const getMeController = async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;

  if (!user) return res.status(401).json({ message: "No autorizado" });

  return res.status(200).json({
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
  });
};

export const registerController = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const exist = await userRepository.findOneBy([
      { email: data.email },
      { username: data.username },
    ]);

    if (exist?.email === data.email)
      return res.status(409).json({ message: "El email esta registrado" });

    if (exist?.username === data.username)
      return res.status(409).json({ message: "El usuario ya esta registrado" });

    const passwordHash = await hashPassword(data.password);

    const user = userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      avatarUrl: data.avatarUrl,
    });
    await userRepository.save(user);

    return res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Datos inválidos", errors: error.issues });
    }

    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  const INVALID_CREDENTIALS_MESSAGE = "Usuario o contraseña incorrectos";
  try {
    const data = loginSchema.parse(req.body);
    const user = await userRepository.findOneBy([
      { email: data.identifier },
      { username: data.identifier },
    ]);

    if (!user)
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });

    const compare = await comparePassword(data.password, user.passwordHash);

    if (!compare)
      return res.status(401).json({ message: INVALID_CREDENTIALS_MESSAGE });

    const token = createToken({ id: user.id, email: user.email });
    return res.status(200).json({
      message: "Se ingreso en el Login exitosamente",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Datos inválidos", errors: error.issues });
    }
    return res
      .status(500)
      .json({ message: "Error interno del servidor, intenta mas tarde" });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as AuthRequest).user;
    const userData = updateProfileSchema.parse(req.body);

    if (userData.username) {
      const exist = await userRepository.findOneBy({
        username: userData.username,
      });

      if (exist && exist.id !== currentUser?.id)
        return res
          .status(409)
          .json({ message: "El nombre de usuario ya existe" });
    }
    const updateUser = {
      ...currentUser,
      ...userData,
    };
    await userRepository.save(updateUser);

    return res.status(200).json({
      id: updateUser.id,
      email: updateUser.email,
      username: updateUser.username,
      avatarUrl: updateUser.avatarUrl,
      message: "El usuario se ha actualizado con exito",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Datos inválidos", errors: err.issues });
    }
    return res
      .status(500)
      .json({ message: "Error interno del servidor, intenta mas tarde" });
  }
};

export const updatePasswordProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const currentUser = (req as AuthRequest).user;
    const userData = updatePasswordSchema.parse(req.body);

    if (typeof currentUser?.passwordHash !== "string")
      return res.status(404).json({ message: "Datos inválido" });
    const valid = await comparePassword(
      userData.currentPassword,
      currentUser?.passwordHash,
    );

    if (!valid)
      return res.status(400).json({
        message: "La contraseña actual no es correcta. No se pudo actualizar",
      });

    if (userData.currentPassword === userData.newPassword)
      return res
        .status(400)
        .json({ message: "La contraseña es la misma. Elige otra" });

    const newHash = await hashPassword(userData.newPassword);

    const updateUser = {
      ...currentUser,
      passwordHash: newHash,
    };

    await userRepository.save(updateUser);

    res.status(200).json({
      message: "La contraseña se ha actualizado con exito",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Datos inválidos", errors: err.issues });
    }
    return res
      .status(500)
      .json({ message: "Error interno del servidor, intenta mas tarde" });
  }
};
