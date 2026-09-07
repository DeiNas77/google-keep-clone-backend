import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

const BASE = "/api/v1.0";

async function registerAndLogin(identifier = "test_user") {
  const registerResponse = await request(app)
    .post(`${BASE}/auth/register`)
    .send({
      username: identifier,
      email: `${identifier}@test.com`,
      password: "Passw0rd!",
    });
  expect(registerResponse.status).toBe(201);

  const loginResponse = await request(app).post(`${BASE}/auth/login`).send({
    identifier,
    password: "Passw0rd!",
  });
  expect(loginResponse.status).toBe(200);

  return loginResponse.body.token as string;
}

describe("Auth", () => {
  describe("POST /auth/register", () => {
    it("201 — registra un usuario nuevo", async () => {
      const response = await request(app).post(`${BASE}/auth/register`).send({
        username: "alice_dev",
        email: "alice@test.com",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        username: "alice_dev",
        email: "alice@test.com",
      });
      expect(response.body).toHaveProperty("id");
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("409 — email duplicado", async () => {
      await registerAndLogin("dup_user");

      const response = await request(app).post(`${BASE}/auth/register`).send({
        username: "otro_nick",
        email: "dup_user@test.com",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("El email esta registrado");
    });

    it("409 — username duplicado", async () => {
      await registerAndLogin("dup_nick");

      const response = await request(app).post(`${BASE}/auth/register`).send({
        username: "dup_nick",
        email: "otro@test.com",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("El usuario ya esta registrado");
    });

    it("400 — password sin mayúscula/número/carácter especial", async () => {
      const response = await request(app).post(`${BASE}/auth/register`).send({
        username: "weak_pass",
        email: "weak@test.com",
        password: "solo-minusculas",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Datos inválidos");
    });
  });

  describe("POST /auth/login", () => {
    it("200 — login con username devuelve token", async () => {
      await registerAndLogin("login_by_username");

      const response = await request(app).post(`${BASE}/auth/login`).send({
        identifier: "login_by_username",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        username: "login_by_username",
      });
    });

    it("200 — login con email devuelve token", async () => {
      await registerAndLogin("login_by_email");

      const response = await request(app).post(`${BASE}/auth/login`).send({
        identifier: "login_by_email@test.com",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("401 — contraseña incorrecta", async () => {
      await registerAndLogin("wrong_pass_user");

      const response = await request(app).post(`${BASE}/auth/login`).send({
        identifier: "wrong_pass_user",
        password: "OtraPassw0rd!",
      });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Usuario o contraseña incorrectos");
    });

    it("401 — usuario inexistente", async () => {
      const response = await request(app).post(`${BASE}/auth/login`).send({
        identifier: "no_existe",
        password: "Passw0rd!",
      });

      expect(response.status).toBe(401);
    });
  });
});
