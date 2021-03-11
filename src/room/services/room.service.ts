import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateMsgInput, CreateMsgOutput } from '../dtos/msg/createMsg.dto';
import {
  CreatePlaylistInput,
  CreatePlaylistOutput,
} from '../dtos/playlist/createPlaylist.dto';
import {
  GetPlaylistByIdInput,
  GetPlaylistByIdOutput,
} from '../dtos/playlist/getPlaylistById.dto';
import {
  UpdatePlaylistInput,
  UpdatePlaylistOutput,
} from '../dtos/playlist/updatePlaylist.dto';
import {
  CreateOrGetPlaylistItemInput,
  CreateOrGetPlaylistItemOutput,
} from '../dtos/playlistItem/createPlaylistItem.dto';
import {
  GetPlaylistItemByIdInput,
  GetPlaylistItemByIdOutput,
} from '../dtos/playlistItem/getPlaylistItemById.dto';
import {
  CreateInviteCodeInput,
  CreateInviteCodeOutput,
} from '../dtos/room/createInviteCode.dto';
import { CreateRoomInput, CreateRoomOutput } from '../dtos/room/createRoom.dto';
import { DeleteRoomInput, DeleteRoomOutput } from '../dtos/room/deleteRoom.dto';
import {
  FindRoomByIdInput,
  FindRoomByIdOutput,
} from '../dtos/room/findRoomById.dto';
import { JoinRoomInput, JoinRoomOutput } from '../dtos/room/joinRoom.dto';
import { UpdateRoomInput, UpdateRoomOutput } from '../dtos/room/updateRoom.dto';
import { Msg } from '../entities/msg.entity';
import { Playlist, PlaylistRelations } from '../entities/playlist.entity';
import { PlaylistItem } from '../entities/playlistItem.entity';
import { Room, RoomRelations } from '../entities/room.entity';
import {
  GET_YOUTUBE_VIDEO_URL,
  PLAY_LIST_ITEM_URL,
  PLAY_LIST_URL,
} from '../playlist.constant';
import { v4 as uuidv4 } from 'uuid';
import { PlaylistItemService } from './playlistItem.service';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Msg) private readonly msgs: Repository<Msg>,
    private readonly userService: UserService,
    private readonly playlistItemService: PlaylistItemService,
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

  async createInviteCodeOutput(
    user: User,
    { id }: CreateInviteCodeInput,
  ): Promise<CreateInviteCodeOutput> {
    try {
      const { ok, error, room } = await this.findRoomById({
        id,
        relations: [RoomRelations.host],
      });
      if (!ok) {
        return { ok, error };
      }

      if (user.id !== room.hostId) {
        return {
          ok: false,
          error:
            'You are not the host of this room, so you can not generate invite code',
        };
      }

      const inviteCode = uuidv4();

      room.inviteCode = inviteCode;

      await this.rooms.save(room);

      return { ok: true, inviteCode };
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
      const room = await this.rooms.findOne(roomId, {
        relations: ['playlistItems'],
      });
      if (!room) {
        return { ok: false, error: 'Room does not exists' };
      }

      // tooo:
      // parse text to validate if there's any links,
      // if there's links, then parse it and getOrCreate PlaylistItem and attach to room
      const {
        ok,
        playlistItem,
      } = await this.playlistItemService.createOrGetPlaylistItem(user, {
        link: text,
      });

      if (ok && playlistItem) {
        room.playlistItems = [...room.playlistItems, playlistItem];
        await this.rooms.save(room);
      }

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
