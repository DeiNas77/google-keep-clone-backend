import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_WEB_TOKEN, JWT_EXPIRES } from "../constants.js";
import type { JwtPayload, SignOptions } from "jsonwebtoken";

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createToken = (payload: { id: string; email: string }) => {
  if (!JWT_WEB_TOKEN || !JWT_EXPIRES)
    throw new Error(
      "Las variables de entorno (JWT_EXPIRES o JWT_WEB_TOKEN) no estan definidas",
    );
  return jwt.sign(payload, JWT_WEB_TOKEN, {
    expiresIn: JWT_EXPIRES as SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string) => {
  if (!token || !JWT_WEB_TOKEN)
    throw new Error("Las variables del token no coinciden");
  const payload = jwt.verify(token, JWT_WEB_TOKEN) as JwtPayload;
  return payload;
};
