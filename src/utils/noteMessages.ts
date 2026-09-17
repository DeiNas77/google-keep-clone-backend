import type { NoteEntity } from "../database/entities/Note.js";

export const getUpdateMessage = (
  before: NoteEntity,
  after: NoteEntity,
): string => {
  if (!before.trashed && after.trashed) return "Nota en la papelera";
  if (before.trashed && !after.trashed) return "Nota restaurada";
  if (!before.archived && after.archived) return "Nota archivada";
  if (before.archived && !after.archived) return "Nota desarchivada";
  return "Nota modificada";
};
