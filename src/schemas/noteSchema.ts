import { z } from "zod";
import { Importance } from "../types/importance.js";

export const noteSchema = z.object({
  title: z.string().trim().max(200).default(""),
  content: z.string().default(""),
  archived: z.boolean().default(false),
  trashed: z.boolean().default(false),
  importance: z.enum(Importance).default(Importance.normal),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().optional(),
  archived: z.boolean().optional(),
  trashed: z.boolean().optional(),
  importance: z.enum(Importance).optional(),
});
