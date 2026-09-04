import "dotenv/config";

export const PORT_APP = process.env.PORT;

export const JWT_WEB_TOKEN = process.env.JWT_SECRET;
export const JWT_EXPIRES = process.env.JWT_EXPIRES_IN;

export const DB = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};
