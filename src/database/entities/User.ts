import { Entity, Column, OneToMany } from "typeorm";
import { CoreEntity } from "./CoreEntity.js";
import { NoteEntity } from "./Note.js";

@Entity("users")
export class UserEntity extends CoreEntity {
  @Column({
    type: "varchar",
    length: 100,
    unique: true,
    nullable: false,
  })
  email!: string;

  @Column({
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  username!: string;

  @Column({
    type: "varchar",
    length: 255,
    name: "password_hash",
    nullable: false,
  })
  passwordHash!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatarUrl?: string;

  @OneToMany(() => NoteEntity, (notes) => notes.user)
  Notes!: NoteEntity[];
}
