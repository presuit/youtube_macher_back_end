import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Common } from 'src/common/entities/common.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { PlaylistItem } from './playlistItem.entity';

export enum PlaylistRelations {
  playlistItems = 'playlistItems',
  owner = 'owner',
}

registerEnumType(PlaylistRelations, { name: 'PlaylistRelations' });

@Entity()
@InputType({ isAbstract: true })
@ObjectType()
export class Playlist extends Common {
  @Column()
  @Field((type) => String)
  playlistId: string;

  @Column()
  @Field((type) => String)
  title: string;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  description?: string;

  //   relations
  @ManyToMany((type) => PlaylistItem)
  @JoinTable()
  @Field((type) => [PlaylistItem])
  playlistItems: PlaylistItem[];

  @RelationId((playlist: Playlist) => playlist.playlistItems)
  playlistItemIds: number[];

  @ManyToOne((type) => User, (user) => user.playlists, { onDelete: 'CASCADE' })
  @Field((type) => User)
  owner: User;

  @RelationId((playlist: Playlist) => playlist.owner)
  ownerId: number;
}
