import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(4, "El username debe tener al menos 4 caracteres")
    .max(50, "El username no puede superar los 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "El username solo puede contener letras, números, guion bajo y punto",
    ),
  email: z.email("Por favor, registra un correo válido").toLowerCase().trim(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/,
      "La contraseña debe tener una mayúscula, un número y un carácter especial",
    ),
  avatarUrl: z.string().trim().optional(),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Ingresa tu email o username"),
  password: z.string().min(1, "Ingresa una contraseña valida"),
});
