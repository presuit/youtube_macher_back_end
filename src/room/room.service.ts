import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isDocumentNode } from 'graphql-tools';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { CreateRoomInput, CreateRoomOutput } from './dtos/createRoom.dto';
import { DeleteRoomInput, DeleteRoomOutput } from './dtos/deleteRoom.dto';
import { FindRoomByIdInput, FindRoomByIdOutput } from './dtos/findRoomById.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/updateRoom.dto';
import { Msg } from './entities/msg.entity';
import { Room } from './entities/room.entity';

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
    { roomId, banUserIds, name }: UpdateRoomInput,
  ): Promise<UpdateRoomOutput> {
    try {
      let room = await this.rooms.findOneOrFail(roomId, {
        relations: ['participants'],
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
}
