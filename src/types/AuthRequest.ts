import type { Request } from "express";
import type { UserEntity } from "../database/entities/User.js";

export interface AuthRequest extends Request {
  user?: UserEntity;
}
