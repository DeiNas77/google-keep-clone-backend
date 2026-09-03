import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { CoreEntity } from "./CoreEntity.js";
import { Importance } from "../../types/importance.js";
import { UserEntity } from "./User.js";

@Entity("notes")
export class NoteEntity extends CoreEntity {
  @Column({ type: "varchar", default: "", nullable: false })
  title!: string;

  @Column({ type: "text", default: "", nullable: false })
  content!: string;

  @Column({ type: "boolean", default: false, nullable: false })
  archived!: boolean;

  @Column({ type: "boolean", default: false, nullable: false })
  trashed!: boolean;

  @Column({
    type: "enum",
    enum: Importance,
    default: Importance.normal,
    nullable: false,
  })
  importance!: Importance;

  @Column({ name: "user_id", type: "uuid", nullable: false })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.Notes)
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;
}
