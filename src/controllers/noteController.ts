import type { Request, Response } from "express";
import { z } from "zod";
import { noteSchema } from "../schemas/noteSchema.js";
import { GlobalRepository } from "../database/repositories/globalRepositories.js";
import type { AuthRequest } from "../types/AuthRequest.js";

const noteRepository = GlobalRepository.NoteRepository;

export const createNoteController = async (req: Request, res: Response) => {
  try {
    const data = noteSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const noteCreate = noteRepository.create({
      ...data,
      userId,
    });
    await noteRepository.save(noteCreate);

    return res.status(201).json({
      id: noteCreate.id,
      title: noteCreate.title,
      content: noteCreate.content,
      archived: noteCreate.archived,
      trashed: noteCreate.trashed,
      importance: noteCreate.importance,
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

