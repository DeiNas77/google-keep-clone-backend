import { DataSource, type Repository } from "typeorm";

/* Entities */
import { NoteEntity } from "../entities/Note.js";
import { UserEntity } from "../entities/User.js";

interface GlobalRepository {
  UserRepository: Repository<UserEntity>;
  NoteRepository: Repository<NoteEntity>;
}

export const GlobalRepository: GlobalRepository = {} as GlobalRepository;
let initialized = false;

export const buildRepositories = (dataSource: DataSource): void => {
  if (initialized) return;
  Object.assign(GlobalRepository, {
    NoteRepository: dataSource.getRepository(NoteEntity),
    UserRepository: dataSource.getRepository(UserEntity),
  });
  initialized = true;
  Object.freeze(GlobalRepository);
};
