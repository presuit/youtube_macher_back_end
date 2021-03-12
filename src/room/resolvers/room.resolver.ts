import { Inject, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { PUB_SUB } from 'src/common/common.constants';
import { User } from 'src/user/entities/user.entity';
import { CreateMsgInput, CreateMsgOutput } from '../dtos/msg/createMsg.dto';
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
import { Room } from '../entities/room.entity';
import { UPDATE_ROOM } from '../room.constant';
import { RoomService } from '../services/room.service';

@UseGuards(AppAuthGuard)
@Resolver()
export class RoomResolver {
  constructor(
    private readonly roomService: RoomService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}
  @AllowedPermission('LogIn')
  @Mutation((returns) => CreateRoomOutput)
  createRoom(
    @AuthUser() user: User,
    @Args('input') input: CreateRoomInput,
  ): Promise<CreateRoomOutput> {
    return this.roomService.createRoom(user, input);
  }

  @AllowedPermission('LogIn')
  @Mutation((returns) => UpdateRoomOutput)
  updateRoom(
    @AuthUser() user: User,
    @Args('input') input: UpdateRoomInput,
  ): Promise<UpdateRoomOutput> {
    return this.roomService.updateRoom(user, input);
  }

  @AllowedPermission('LogIn')
  @Mutation((returns) => DeleteRoomOutput)
  deleteRoom(
    @AuthUser() user: User,
    @Args('input') input: DeleteRoomInput,
  ): Promise<DeleteRoomOutput> {
    return this.roomService.deleteRoom(user, input);
  }

  @AllowedPermission('LogIn')
  @Query((returns) => FindRoomByIdOutput)
  findRoomById(
    @Args('input') input: FindRoomByIdInput,
  ): Promise<FindRoomByIdOutput> {
    return this.roomService.findRoomById(input);
  }

  @AllowedPermission('LogIn')
  @Mutation((returns) => JoinRoomOutput)
  joinRoom(
    @AuthUser() user: User,
    @Args('input') input: JoinRoomInput,
  ): Promise<JoinRoomOutput> {
    return this.roomService.joinRoom(user, input);
  }

  @AllowedPermission('LogIn')
  @Query((returns) => CreateInviteCodeOutput)
  createInviteCode(
    @AuthUser() user: User,
    @Args('input') input: CreateInviteCodeInput,
  ): Promise<CreateInviteCodeOutput> {
    return this.roomService.createInviteCodeOutput(user, input);
  }

  @AllowedPermission('LogIn')
  @Mutation((returns) => CreateMsgOutput)
  createMsg(
    @AuthUser() user: User,
    @Args('input') input: CreateMsgInput,
  ): Promise<CreateMsgOutput> {
    return this.roomService.createMsg(user, input);
  }

  @AllowedPermission('Allowed')
  @Subscription((returns) => Room)
  updateRoomRealTime() {
    return this.pubsub.asyncIterator(UPDATE_ROOM);
  }
}
