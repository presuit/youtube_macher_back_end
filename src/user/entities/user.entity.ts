import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Common } from 'src/common/entities/common.entity';
import { Playlist } from 'src/room/entities/playlist.entity';
import { Room } from 'src/room/entities/room.entity';
import { Column, Entity, ManyToMany, OneToMany, RelationId } from 'typeorm';

export enum UserRelations {
  rooms = 'rooms',
}

registerEnumType(UserRelations, { name: 'UserRelations' });

@Entity()
@InputType({ isAbstract: true })
@ObjectType()
export class User extends Common {
  @Column()
  @Field((type) => String)
  googleId: string;

  @Column()
  @Field((type) => String)
  username: string;

  @Column()
  @Field((type) => String)
  email: string;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  thumbnailImg?: string | null;

  @Column()
  @Field((type) => String)
  accessToken: string;

  // relations
  @ManyToMany((type) => Room, (room) => room.participants, { nullable: true })
  @Field((type) => [Room], { nullable: true })
  rooms?: Room[];

  @RelationId((user: User) => user.rooms)
  roomIds: number[];

  @OneToMany((type) => Playlist, (playlist) => playlist.owner, {
    nullable: true,
  })
  @Field((type) => [Playlist], { nullable: true })
  playlists?: Playlist[];
}
