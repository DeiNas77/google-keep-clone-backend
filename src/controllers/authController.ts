import type { Request, Response } from "express";
import { z } from "zod";
import { GlobalRepository } from "../database/repositories/globalRepositories.js";
import { registerSchema } from "../schemas/authSchema.js";
import { hashPassword } from "../utils/auth.js";

const userRepository = GlobalRepository.UserRepository;

export const Register = async (req: Request, res: Response) => {
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
      avatarUrl: data.avatarUrl,
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
