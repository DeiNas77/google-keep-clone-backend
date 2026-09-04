import type { Request, Response } from "express";
import { z } from "zod";
import { GlobalRepository } from "../database/repositories/globalRepositories.js";
import { loginSchema, registerSchema } from "../schemas/authSchema.js";
import { comparePassword, createToken, hashPassword } from "../utils/auth.js";

const userRepository = GlobalRepository.UserRepository;

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
