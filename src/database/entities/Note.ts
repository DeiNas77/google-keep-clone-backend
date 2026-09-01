import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { CoreEntity } from "./CoreEntity.js";
import { Importance } from "../../types/importance.js";
import { UserEntity } from "./User.js";

@Entity("notes")
export class NoteEntity extends CoreEntity {
  @Column({ type: "varchar", default: "" })
  title!: string;

  @Column({ type: "text", default: "" })
  content!: string;

  @Column({ type: "boolean", default: false })
  archived!: boolean;

  @Column({ type: "boolean", default: false })
  trashed!: boolean;

  @Column({
    type: "enum",
    enum: Importance,
    default: Importance.normal,
  })
  importance!: Importance;

  @JoinColumn({ name: "user_id" })
  @ManyToOne(() => UserEntity, (user) => user.Notes)
  user!: UserEntity;
}
