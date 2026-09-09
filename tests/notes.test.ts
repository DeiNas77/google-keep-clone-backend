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

  describe("GET /notes?q= — búsqueda", () => {
    it("200 — q filtra por título y por contenido (ILIKE)", async () => {
      const token = await registerAndLogin("search_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Comprar cafe en el mercado", content: "arvejas" });
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Receta taller", content: "cafe con leche" });

      const byTitle = await request(app)
        .get(`${BASE}/notes?q=cafe`)
        .set("Authorization", `Bearer ${token}`);
      expect(byTitle.status).toBe(200);
      expect(byTitle.body.total).toBe(2);
      expect(byTitle.body.notes.map((n: { title: string }) => n.title)).toEqual(
        ["Comprar cafe en el mercado", "Receta taller"],
      );
    });

    it("200 — la búsqueda no distingue mayúsculas", async () => {
      const token = await registerAndLogin("search_case_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Arquitectura limpia" });

      const response = await request(app)
        .get(`${BASE}/notes?q=ARQUITECTURA`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.notes[0].title).toBe("Arquitectura limpia");
    });

    it("200 — sin coincidencias devuelve lista vacía (no error)", async () => {
      const token = await registerAndLogin("search_empty_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota normal" });

      const response = await request(app)
        .get(`${BASE}/notes?q=inexistente`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });

    it("200 — la búsqueda respeta el scoping del usuario", async () => {
      const token = await registerAndLogin("search_owner_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Secreto de jose" });

      const otherToken = await registerAndLogin("search_other_user");
      const response = await request(app)
        .get(`${BASE}/notes?q=jose`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(0);
    });

    it("200 — sin q? devuelve todas las notas de ese usuario", async () => {
      const token = await registerAndLogin("search_noq_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota A" });
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota B" });

      const response = await request(app)
        .get(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(2);
    });
  });

  describe("GET /notes?page=&limit= — paginación", () => {
    it("200 — responde la estructura completa del contrato", async () => {
      const token = await registerAndLogin("pagination_shape_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota alpha" });
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota beta" });

      const response = await request(app)
        .get(`${BASE}/notes?page=1&limit=1`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        notes: expect.any(Array),
        total: 2,
        page: 1,
        limit: 1,
        totalPages: 2,
      });
      expect(response.body.notes).toHaveLength(1);
    });

    it("200 — cada página trae su rebanada (skip correcto)", async () => {
      const token = await registerAndLogin("pagination_slice_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota uno" });
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota dos" });
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota tres" });

      const page1 = await request(app)
        .get(`${BASE}/notes?page=1&limit=2`)
        .set("Authorization", `Bearer ${token}`);
      expect(page1.body.notes).toHaveLength(2);
      expect(page1.body.totalPages).toBe(2);

      const page2 = await request(app)
        .get(`${BASE}/notes?page=2&limit=2`)
        .set("Authorization", `Bearer ${token}`);
      expect(page2.body.notes).toHaveLength(1);
      // Scoping: las páginas no repiten ni filtran notas de otro usuario
      expect(page2.body.notes[0].title).toBe("Nota tres");
    });

    it("200 — page=0 se normaliza a página 1", async () => {
      const token = await registerAndLogin("pagination_zero_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota única" });

      const response = await request(app)
        .get(`${BASE}/notes?page=0&limit=20`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.notes).toHaveLength(1);
    });

    it("200 — page más allá del final devuelve lista vacía, total intacto", async () => {
      const token = await registerAndLogin("pagination_beyond_user");
      await request(app)
        .post(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Nota única" });

      const response = await request(app)
        .get(`${BASE}/notes?page=99&limit=20`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.notes).toHaveLength(0);
      expect(response.body.total).toBe(1);
      expect(response.body.totalPages).toBe(1);
    });

    it("200 — defaults implícitos y recorte del máximo en un solo lote", async () => {
      const token = await registerAndLogin("pagination_limit_user");
      // Creo 21 notas: suficiente para tocar el default (20) y el tope
      for (let i = 1; i <= 21; i++) {
        await request(app)
          .post(`${BASE}/notes`)
          .set("Authorization", `Bearer ${token}`)
          .send({ title: `Nota ${i}` });
      }

      // Sin params: default page=1 y limit=20
      const defaults = await request(app)
        .get(`${BASE}/notes`)
        .set("Authorization", `Bearer ${token}`);
      expect(defaults.body.notes).toHaveLength(20);
      expect(defaults.body.total).toBe(21);
      expect(defaults.body.totalPages).toBe(2);

      // limit=9999: Math.min recorta al máximo permitido (20)
      const capped = await request(app)
        .get(`${BASE}/notes?limit=9999`)
        .set("Authorization", `Bearer ${token}`);
      expect(capped.body.notes).toHaveLength(20);
      expect(capped.body.limit).toBe(20);
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
