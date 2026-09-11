import { z } from "zod";

/** Valida los requisitos de la contraseña por separado para reportar CUÁL falta. */
function validatePasswordRequirements(
  value: string,
  ctx: z.RefinementCtx,
): void {
  const requirements = [
    {
      test: /[A-Z]/,
      message: "La contraseña necesita al menos una letra mayúscula",
    },
    {
      test: /\d/,
      message: "La contraseña necesita al menos un número",
    },
    {
      test: /[!@#$%^&*]/,
      message:
        "La contraseña necesita al menos un carácter especial (!@#$%^&*)",
    },
  ];

  for (const { test, message } of requirements) {
    if (!test.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  }
}

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
    .superRefine(validatePasswordRequirements),
  avatarUrl: z.string().trim().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Ingresa tu email o username"),
  password: z.string().min(1, "Ingresa una contraseña valida"),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(4, "El username debe tener al menos 4 caracteres")
    .max(50, "El username no puede superar los 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      "El username solo puede contener letras, números, guión bajo y punto",
    )
    .optional(),
  avatarUrl: z.string().trim().optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .superRefine(validatePasswordRequirements),
  newPassword: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .superRefine(validatePasswordRequirements),
});
