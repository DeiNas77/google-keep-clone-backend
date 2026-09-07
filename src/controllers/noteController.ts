import type { Request, Response } from "express";
import { z } from "zod";
import { noteSchema, updateNoteSchema } from "../schemas/noteSchema.js";
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

export const getNoteController = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  try {
    if (!userId) {
      return res.status(401).json({ message: "No autorizado" });
    }
    const notes = await noteRepository.findBy({ userId });

    return res.status(200).json({ notes });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getStatsController = async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id;
  try {
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const [total, archived, trashed] = await Promise.all([
      noteRepository.countBy({ userId }),
      noteRepository.countBy({ userId, archived: true }),
      noteRepository.countBy({ userId, trashed: true }),
    ]);

    return res.status(200).json({ total, archived, trashed });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const updateNoteController = async (req: Request, res: Response) => {
  try {
    const id = req?.params?.id;
    const userId = (req as AuthRequest).user?.id;
    const data = updateNoteSchema.parse(req.body);

    if (typeof id !== "string") {
      return res.status(400).json({ message: "ID inválido" });
    }

    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const findNote = await noteRepository.findOneBy({ id, userId });

    if (!findNote)
      return res.status(404).json({ message: "La nota no fue encontrada" });

    const noteUpdate = noteRepository.create({
      ...findNote,
      ...data,
    });
    await noteRepository.save(noteUpdate);

    return res.status(200).json({ ...noteUpdate, message: "Nota modificada" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Datos inválidos", errors: error.issues });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const deleteNoteController = async (req: Request, res: Response) => {
  try {
    const id = req.params?.id;
    const userId = (req as AuthRequest).user?.id;

    if (typeof id !== "string")
      return res.status(400).json({ message: "ID inválido" });

    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const findNote = await noteRepository.findOneBy({ id, userId });

    if (!findNote)
      return res.status(404).json({ message: "Nota no encontrada" });

    await noteRepository.remove(findNote);
    return res.status(200).json({ message: "Nota eliminada con exito" });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
