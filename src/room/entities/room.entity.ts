import {
  Field,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Common } from 'src/common/entities/common.entity';
import { PlaylistItem } from 'src/playlist/entities/playlistItem.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { Msg } from './msg.entity';

export enum RoomRelations {
  host = 'host',
  participants = 'participants',
  msgs = 'msgs',
}

registerEnumType(RoomRelations, { name: 'RoomRelations' });

@Entity()
@InputType({ isAbstract: true })
@ObjectType()
export class Room extends Common {
  @Column()
  @Field((type) => String)
  name: string;

  // relations
  @ManyToOne((type) => User)
  @Field((type) => User)
  host: User;

  @RelationId((room: Room) => room.host)
  hostId: number;

  @ManyToMany((type) => User, (user) => user.rooms)
  @JoinTable()
  @Field((type) => [User])
  participants: User[];

  @RelationId((room: Room) => room.participants)
  participantIds: number[];

  @OneToMany((type) => Msg, (msg) => msg.room, { nullable: true })
  @Field((type) => [Msg], { nullable: true })
  msgs?: Msg[];

  @RelationId((room: Room) => room.msgs)
  msgIds: number[];

  @ManyToMany((type) => PlaylistItem, { nullable: true })
  @JoinTable()
  @Field((type) => [PlaylistItem], { nullable: true })
  playlistItems?: PlaylistItem[];

  @RelationId((room: Room) => room.playlistItems)
  playlistItemIds: number[];
}
