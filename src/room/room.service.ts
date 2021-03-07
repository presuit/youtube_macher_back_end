import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateMsgInput, CreateMsgOutput } from './dtos/msg/createMsg.dto';
import {
  CreatePlaylistInput,
  CreatePlaylistOutput,
} from './dtos/playlist/createPlaylist.dto';
import {
  CreateOrGetPlaylistItemInput,
  CreateOrGetPlaylistItemOutput,
} from './dtos/playlistItem/createPlaylistItem.dto';
import {
  GetPlaylistItemByIdInput,
  GetPlaylistItemByIdOutput,
} from './dtos/playlistItem/getPlaylistItemById.dto';
import { CreateRoomInput, CreateRoomOutput } from './dtos/room/createRoom.dto';
import { DeleteRoomInput, DeleteRoomOutput } from './dtos/room/deleteRoom.dto';
import {
  FindRoomByIdInput,
  FindRoomByIdOutput,
} from './dtos/room/findRoomById.dto';
import { JoinRoomInput, JoinRoomOutput } from './dtos/room/joinRoom.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/room/updateRoom.dto';
import { Msg } from './entities/msg.entity';
import { Playlist } from './entities/playlist.entity';
import { PlaylistItem } from './entities/playlistItem.entity';
import { Room, RoomRelations } from './entities/room.entity';
import {
  GET_YOUTUBE_VIDEO_URL,
  INSERT_PLAY_LIST_URL,
} from './playlist.constant';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Msg) private readonly msgs: Repository<Msg>,
    private readonly userService: UserService,
  ) {}

  async createRoom(
    user: User,
    { name }: CreateRoomInput,
  ): Promise<CreateRoomOutput> {
    try {
      const room = this.rooms.create({
        name,
        participants: [user],
        host: user,
      });
      console.log(user);
      await this.rooms.save(room);
      return { ok: true, roomId: room.id };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async updateRoom(
    user: User,
    { roomId, banUserIds, name, unbanUserIds }: UpdateRoomInput,
  ): Promise<UpdateRoomOutput> {
    try {
      let room = await this.rooms.findOneOrFail(roomId, {
        relations: ['participants', 'bannedUsers'],
      });

      if (user.id !== room.hostId) {
        return {
          ok: false,
          error: 'You are not the host who can update this room',
        };
      }

      if (name && name !== room.name) {
        room.name = name;
      }

      if (banUserIds) {
        for (const banId of banUserIds) {
          const targetUser = room.participants.find(
            (eachUser) => eachUser.id === banId,
          );
          if (targetUser) {
            //   host can't be banned
            if (targetUser.id === room.hostId) {
              continue;
            }
            room.participants = room.participants.filter(
              (eachUser) => eachUser.id !== targetUser.id,
            );
            room.bannedUsers = [...room.bannedUsers, targetUser];
          }
        }
      }

      if (unbanUserIds) {
        for (const unbanId of unbanUserIds) {
          const exists = room.bannedUsers.find((each) => each.id === unbanId);
          if (exists) {
            room.bannedUsers = room.bannedUsers.filter(
              (each) => each.id !== exists.id,
            );
          }
        }
      }

      await this.rooms.save(room);
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async deleteRoom(
    user: User,
    { id }: DeleteRoomInput,
  ): Promise<DeleteRoomOutput> {
    try {
      const room = await this.rooms.findOneOrFail(id);

      if (room.hostId !== user.id) {
        return {
          ok: false,
          error: 'You are not the host who can delete this room',
        };
      }

      await this.rooms.delete(id);

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async findRoomById({
    id,
    relations,
  }: FindRoomByIdInput): Promise<FindRoomByIdOutput> {
    try {
      const room = await this.rooms.findOneOrFail(id, {
        ...(relations && { relations: [...relations] }),
      });
      return { ok: true, room };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async joinRoom(
    user: User,
    { roomId }: JoinRoomInput,
  ): Promise<JoinRoomOutput> {
    try {
      const room = await this.rooms.findOne(roomId, {
        relations: ['participants', 'bannedUsers'],
      });
      if (!room) {
        return { ok: false, error: 'Room does not exist' };
      }

      if (room.participants && room.participants.length !== 0) {
        const exists = room.participants.find((each) => each.id === user.id);
        if (exists) {
          return { ok: false, error: 'You already join the room' };
        }

        // if this user is banned for this room, then this user can not join room
        const banValidation = room.bannedUsers.find(
          (each) => each.id === user.id,
        );
        if (banValidation) {
          return { ok: false, error: 'You are banned this room' };
        }
      }

      await this.rooms.save([
        {
          id: room.id,
          participants: [...room.participants, user],
        },
      ]);

      // tooo:
      // should use pubsub to notice new user join the room, and refresh room's participants real time

      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async createMsg(
    user: User,
    { roomId, text }: CreateMsgInput,
  ): Promise<CreateMsgOutput> {
    try {
      const room = await this.rooms.findOne(roomId);
      if (!room) {
        return { ok: false, error: 'Room does not exists' };
      }

      // tooo:
      // parse text to validate if there's any links,
      // if there's links, then parse it and getOrCreate PlaylistItem and attach to room

      const newMsg = this.msgs.create({ fromId: user.id, room, text });

      // tooo:
      //  using pubsub, make room chat real time stuff

      await this.msgs.save(newMsg);
      return { ok: true, msgId: newMsg.id };
    } catch (error) {
      return { ok: false, error };
    }
  }
}

@Injectable()
export class PlaylistItemService {
  constructor(
    @InjectRepository(PlaylistItem)
    private readonly playlistItems: Repository<PlaylistItem>,
  ) {}

  async parseLink(
    link: string,
    user: User,
  ): Promise<{
    ok: boolean;
    error?: string;
    videoId?: string;
  }> {
    try {
      const validateYoutubeUrl_1 = link.includes(
        'https://www.youtube.com/watch',
      );
      const validateYoutubeUrl_2 = link.includes('https://youtu.be');

      let videoId: string;

      if (validateYoutubeUrl_1) {
        videoId = link.split('&')[0].split('v=')[1];
      } else if (validateYoutubeUrl_2) {
        const tokens = link.split('/');
        videoId = tokens[tokens.length - 1];
      } else {
        return { ok: false, error: 'Your link does not have youtube address' };
      }

      return { ok: true, videoId };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async createOrGetPlaylistItem(
    user: User,
    { link }: CreateOrGetPlaylistItemInput,
  ): Promise<CreateOrGetPlaylistItemOutput> {
    try {
      const { ok, error, videoId } = await this.parseLink(link, user);

      if (!ok) {
        return { ok, error };
      }

      let playlistItem = await this.playlistItems.findOne({ videoId });
      if (playlistItem) {
        // if there's already playlistItem exists, then return it
        return { ok: true, playlistItemId: playlistItem.id };
      }

      // or create new one

      const response = await axios.get(
        `${GET_YOUTUBE_VIDEO_URL}/?part=snippet&id=${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      const videoSnippet = response.data.items[0].snippet;
      const title = videoSnippet.title;
      const description = videoSnippet.description;
      const thumbnailImg = videoSnippet.thumbnails.standard.url;

      playlistItem = this.playlistItems.create({
        description,
        originalLink: link,
        thumbnailImg,
        title,
        videoId,
        kind: 'youtube#video',
      });

      await this.playlistItems.save(playlistItem);

      return { ok: true, playlistItemId: playlistItem.id };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async getPlaylistItemById({
    id,
  }: GetPlaylistItemByIdInput): Promise<GetPlaylistItemByIdOutput> {
    try {
      const playlistItem = await this.playlistItems.findOneOrFail(id);
      return { ok: true, playlistItem };
    } catch (error) {
      return { ok: false, error };
    }
  }
}

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlists: Repository<Playlist>,
    private readonly playlistItemService: PlaylistItemService,
    private readonly roomService: RoomService,
  ) {}

  async createPlaylist(
    user: User,
    { playlistItemIds, title, description, roomId }: CreatePlaylistInput,
  ): Promise<CreatePlaylistOutput> {
    try {
      const container: PlaylistItem[] = [];

      const {
        ok: roomOk,
        error: roomError,
        room,
      } = await this.roomService.findRoomById({
        id: roomId,
        relations: [RoomRelations.participants, RoomRelations.playlistItems],
      });

      if (!roomOk) {
        return { ok: roomOk, error: roomError };
      }

      let playlist = await this.playlists.findOne({ title });

      if (playlist) {
        return {
          ok: false,
          error: "Already  exists playlist's title, rename it",
        };
      }

      for (const id of playlistItemIds) {
        if (!room.playlistItems || room.playlistItems.length == 0) {
          return {
            ok: false,
            error: "Your room's playlistItems are empty",
          };
        }
        const existOnRoom = room.playlistItems.find((each) => each.id === id);
        if (!existOnRoom) {
          return {
            ok: false,
            error:
              'You just add some playlistItem that does not exists in the room',
          };
        }
        const {
          ok,
          playlistItem,
          error,
        } = await this.playlistItemService.getPlaylistItemById({ id });
        if (!ok) {
          return { ok, error };
        }
        container.push(playlistItem);
      }

      playlist = this.playlists.create({
        title,
        ...(description && { description }),
        owner: user,
        playlistItems: container,
      });

      const data = {
        snippet: {
          title,
          ...(description && { description }),
        },
      };

      const response = await axios.post(INSERT_PLAY_LIST_URL, data, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      console.log(response.data);

      // await this.playlists.save(playlist);
      return { ok: true, playlistId: playlist.id };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
