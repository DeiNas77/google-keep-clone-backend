import { describe, expect, it } from "vitest";
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

  describe("GET /auth/me", () => {
    it("200 — devuelve el perfil del usuario autenticado", async () => {
      const token = await registerAndLogin("me_user");

      const response = await request(app)
        .get(`${BASE}/auth/me`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: "me_user@test.com",
        username: "me_user",
        avatarUrl: null,
      });
    });

    it("200 — NUNCA expone el passwordHash", async () => {
      const token = await registerAndLogin("me_security_user");

      const response = await request(app)
        .get(`${BASE}/auth/me`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).not.toHaveProperty("passwordHash");
      expect(response.body).not.toHaveProperty("password");
    });

    it("401 — sin token", async () => {
      const response = await request(app).get(`${BASE}/auth/me`);

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /auth/update-username-profile", () => {
    it("200 — cambia el username", async () => {
      const token = await registerAndLogin("profile_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "profile_nuevo" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        username: "profile_nuevo",
        email: "profile_user@test.com",
      });
      expect(response.body).not.toHaveProperty("passwordHash");
    });

    it("200 — mismo username: idempotente, NO dispara falso 409", async () => {
      const token = await registerAndLogin("same_name_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "same_name_user" });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("same_name_user");
    });

    it("200 — actualiza avatarUrl solo (sin tocar username)", async () => {
      const token = await registerAndLogin("avatar_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ avatarUrl: "https://example.com/avatar.png" });

      expect(response.status).toBe(200);
      expect(response.body.avatarUrl).toBe("https://example.com/avatar.png");
      expect(response.body.username).toBe("avatar_user");
    });

    it("409 — username ya lo tiene OTRO usuario", async () => {
      const token = await registerAndLogin("owner_user");
      await registerAndLogin("taken_nick");

      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "taken_nick" });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("El nombre de usuario ya existe");
    });

    it("400 — username demasiado corto (mínimo 4)", async () => {
      const token = await registerAndLogin("short_name_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "abc" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Datos inválidos");
    });

    it("400 — username con caracteres prohibidos", async () => {
      const token = await registerAndLogin("bad_chars_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "mal nombre!" });

      expect(response.status).toBe(400);
    });

    it("401 — sin token", async () => {
      const response = await request(app)
        .patch(`${BASE}/auth/update-username-profile`)
        .send({ username: "sin_token" });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /auth/update-password-profile", () => {
    it("200 — cambia la contraseña; la vieja deja de servir", async () => {
      const token = await registerAndLogin("pwd_user");

      const changeResponse = await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Passw0rd!", newPassword: "Nueva123!" });

      expect(changeResponse.status).toBe(200);
      expect(changeResponse.body.message).toBe(
        "La contraseña se ha actualizado con exito",
      );
      expect(changeResponse.body).not.toHaveProperty("passwordHash");

      // La VIEJA ya no debe autenticar
      const oldLogin = await request(app)
        .post(`${BASE}/auth/login`)
        .send({ identifier: "pwd_user", password: "Passw0rd!" });
      expect(oldLogin.status).toBe(401);

      // La NUEVA sí autentica
      const newLogin = await request(app)
        .post(`${BASE}/auth/login`)
        .send({ identifier: "pwd_user", password: "Nueva123!" });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body).toHaveProperty("token");
    });

    it("400 — currentPassword incorrecta", async () => {
      const token = await registerAndLogin("wrong_current_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Incorrecta1!", newPassword: "Nueva123!" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "La contraseña actual no es correcta. No se pudo actualizar",
      );
    });

    it("400 — nueva contraseña igual a la actual", async () => {
      const token = await registerAndLogin("same_pwd_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Passw0rd!", newPassword: "Passw0rd!" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "La contraseña es la misma. Elige otra",
      );
    });

    it("400 — nueva contraseña débil (sin mayúscula/número/especial)", async () => {
      const token = await registerAndLogin("weak_new_pwd_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Passw0rd!", newPassword: "solo-minusculas" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Datos inválidos");
    });

    it("400 — falta currentPassword en el body", async () => {
      const token = await registerAndLogin("missing_current_user");

      const response = await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ newPassword: "Nueva123!" });

      expect(response.status).toBe(400);
    });

    it("401 — sin token", async () => {
      const response = await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .send({ currentPassword: "Passw0rd!", newPassword: "Nueva123!" });

      expect(response.status).toBe(401);
    });

    it("200 — después de cambiar, el token VIEJO sigue siendo válido (JWT stateless)", async () => {
      const token = await registerAndLogin("token_still_valid_user");

      await request(app)
        .patch(`${BASE}/auth/update-password-profile`)
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "Passw0rd!", newPassword: "Nueva123!" });

      const meResponse = await request(app)
        .get(`${BASE}/auth/me`)
        .set("Authorization", `Bearer ${token}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.username).toBe("token_still_valid_user");
    });
  });
});
