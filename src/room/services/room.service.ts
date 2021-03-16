import { Inject, Injectable } from '@nestjs/common';
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
  UPDATE_ROOM,
} from '../room.constant';
import { v4 as uuidv4 } from 'uuid';
import { PlaylistItemService } from './playlistItem.service';
import { PUB_SUB } from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { JwtService } from 'src/jwt/jwt.service';
import { IJwtTokenPayload } from '../../jwt/jwt.types';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly rooms: Repository<Room>,
    @InjectRepository(Msg) private readonly msgs: Repository<Msg>,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
    private readonly playlistItemService: PlaylistItemService,
    private readonly jwtService: JwtService,
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
      const { ok, error, room } = await this.findRoomById({
        id: roomId,
        relations: [
          RoomRelations.bannedUsers,
          RoomRelations.participants,
          RoomRelations.msgs,
          RoomRelations.playlistItems,
        ],
      });

      if (!ok) {
        return { ok, error };
      }

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

      await this.pubsub.publish(UPDATE_ROOM, {
        updateRoomRealTime: { ...room },
      });

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
      const { ok, error, room } = await this.findRoomById({
        id: roomId,
        relations: [
          RoomRelations.participants,
          RoomRelations.bannedUsers,
          RoomRelations.msgs,
          RoomRelations.playlistItems,
        ],
      });

      if (!ok) {
        return { ok, error };
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

      room.participants.push(user);

      await this.rooms.save(room);

      // tooo:
      // should use pubsub to notice new user join the room, and refresh room's participants real time
      await this.pubsub.publish(UPDATE_ROOM, {
        updateRoomRealTime: { ...room },
      });

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
      const { ok, error, room } = await this.findRoomById({
        id: roomId,
        relations: [
          RoomRelations.playlistItems,
          RoomRelations.msgs,
          RoomRelations.participants,
        ],
      });

      if (!ok) {
        return { ok, error };
      }

      const parsedLinks = text.split(' ');
      const validYoutubeLink = parsedLinks.find(
        (each) =>
          each.includes('https://www.youtube.com/watch') ||
          each.includes('https://youtu.be'),
      );

      console.log(validYoutubeLink);

      if (validYoutubeLink) {
        const {
          ok,
          playlistItem,
        } = await this.playlistItemService.createOrGetPlaylistItem(user, {
          link: validYoutubeLink,
        });

        if (ok && playlistItem) {
          const existOnRoom = room.playlistItems.find(
            (each) => each.id === playlistItem.id,
          );
          if (!existOnRoom) {
            room.playlistItems = [...room.playlistItems, playlistItem];
            await this.rooms.save(room);
          }
        }
      }

      const newMsg = this.msgs.create({ fromId: user.id, room, text });
      await this.msgs.save(newMsg);

      // tooo:
      //  using pubsub, make room chat real time stuff
      room.msgs.push(newMsg);
      await this.pubsub.publish(UPDATE_ROOM, {
        updateRoomRealTime: { ...room },
      });

      return { ok: true, msgId: newMsg.id };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async filterRoom(payload, context): Promise<{ ok: boolean }> {
    try {
      if (context.token) {
        const user = this.jwtService.verifyJwtToken(context.token);

        if (typeof user === 'object' && user['id']) {
          const id = user['id'];
          const participants = payload.updateRoomRealTime.participants;

          if (!participants || participants.length === 0) {
            return { ok: false };
          }

          const existOnRoom = participants.find((each) => each.id === id);
          if (existOnRoom) {
            return { ok: true };
          }
        }
      }

      return { ok: false };
    } catch (error) {
      return { ok: false };
    }
  }
}
