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

describe("Notes CRUD", () => {
  describe("Autenticación requerida", () => {
    it("401 — GET /notes sin token", async () => {
      const response = await request(app).get(`${BASE}/notes`);
      expect(response.status).toBe(401);
    });

    it("401 — POST /notes sin token", async () => {
      const response = await request(app)
        .post(`${BASE}/notes`)
        .send({ title: "Sin token" });
      expect(response.status).toBe(401);
    });

    it("401 — PATCH /notes/:id sin token", async () => {
      const response = await request(app)
        .patch(`${BASE}/notes/00000000-0000-0000-0000-000000000000`)
        .send({ title: "Sin token" });
      expect(response.status).toBe(401);
    });

    it("401 — DELETE /notes/:id sin token", async () => {
      const response = await request(app).delete(
        `${BASE}/notes/00000000-0000-0000-0000-000000000000`,
      );
      expect(response.status).toBe(401);
    });
  });

  describe("POST /notes", () => {
    it("201 — crea una nota con valores por defecto", async () => {
      const token = await registerAndLogin("creator_user");
      const response = await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Mi primera nota" });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: "Mi primera nota",
        content: "",
        archived: false,
        trashed: false,
        importance: "normal",
      });
      expect(response.body).toHaveProperty("id");
      expect(response.body).not.toHaveProperty("userId");
    });

    it("201 — crea otra nota y NO ve la del otro usuario", async () => {
      const token = await registerAndLogin("scoped_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota privada" });

      const otherToken = await registerAndLogin("scoped_user_2");
      const listResponse = await request(app)
        .get(`${BASE}/notes`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.notes).toHaveLength(0);
    });
  });

  describe("GET /notes", () => {
    it("200 — lista solo las notas del usuario autenticado", async () => {
      const token = await registerAndLogin("list_user");

      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota 1" });
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota 2" });

      const response = await request(app)
        .get(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(2);
      expect(response.body.notes[0]).toMatchObject({ title: "Nota 1" });
    });
  });

  describe("PATCH /notes/:id", () => {
    it("200 — actualiza título y archived", async () => {
      const token = await registerAndLogin("updater_user");
      const created = await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Antes", content: "contenido" });

      const response = await request(app)
        .patch(`${BASE}/notes/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Después", archived: true });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        title: "Después",
        archived: true,
      });
      // El update hace merge: no pierde el content original
      expect(response.body.content).toBe("contenido");
    });

    it("404 — nota inexistente (controlador, no la de Express)", async () => {
      const token = await registerAndLogin("not_found_user");
      const response = await request(app)
        .patch(`${BASE}/notes/00000000-0000-0000-0000-000000000000`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nada" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("La nota no fue encontrada");
    });
  });

  describe("DELETE /notes/:id", () => {
    it("200 — elimina la nota y deja de aparecer en la lista", async () => {
      const token = await registerAndLogin("deleter_user");
      const created = await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "A borrar" });

      const deleteResponse = await request(app)
        .delete(`${BASE}/notes/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe("Nota eliminada con exito");

      const listResponse = await request(app)
        .get(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`);

      expect(listResponse.body.notes).toHaveLength(0);
    });
  });
});
