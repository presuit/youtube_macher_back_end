import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { User } from 'src/user/entities/user.entity';
import { CreateMsgInput, CreateMsgOutput } from './dtos/msg/createMsg.dto';
import {
  CreatePlaylistInput,
  CreatePlaylistOutput,
} from './dtos/playlist/createPlaylist.dto';
import {
  GetPlaylistByIdInput,
  GetPlaylistByIdOutput,
} from './dtos/playlist/getPlaylistById.dto';
import {
  UpdatePlaylistInput,
  UpdatePlaylistOutput,
} from './dtos/playlist/updatePlaylist.dto';
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
import {
  PlaylistItemService,
  PlaylistService,
  RoomService,
} from './room.service';

@UseGuards(AppAuthGuard)
@Resolver()
export class PlaylistResolver {
  constructor(private readonly playlistService: PlaylistService) {}

  @AllowedPermission('LogIn')
  @Mutation((returns) => CreatePlaylistOutput)
  createPlaylist(
    @AuthUser() user: User,
    @Args('input') input: CreatePlaylistInput,
  ): Promise<CreatePlaylistOutput> {
    return this.playlistService.createPlaylist(user, input);
  }

  @AllowedPermission('LogIn')
  @Query((returns) => GetPlaylistByIdOutput)
  getPlaylistById(
    @AuthUser() user: User,
    @Args('input') input: GetPlaylistByIdInput,
  ): Promise<GetPlaylistByIdOutput> {
    return this.playlistService.getPlaylistById(user, input);
  }

  @AllowedPermission('LogIn')
  @Mutation((returns) => UpdatePlaylistOutput)
  updatePlaylistOutput(
    @AuthUser() user: User,
    @Args('input') input: UpdatePlaylistInput,
  ): Promise<UpdatePlaylistOutput> {
    return this.playlistService.updatePlaylist(user, input);
  }
}

@UseGuards(AppAuthGuard)
@Resolver()
export class PlaylistItemResolver {
  constructor(private readonly playlistItemService: PlaylistItemService) {}

  @AllowedPermission('LogIn')
  @Mutation((returns) => CreateOrGetPlaylistItemOutput)
  createOrGetPlaylistItem(
    @AuthUser() user: User,
    @Args('input') input: CreateOrGetPlaylistItemInput,
  ): Promise<CreateOrGetPlaylistItemOutput> {
    return this.playlistItemService.createOrGetPlaylistItem(user, input);
  }

  @AllowedPermission('LogIn')
  @Query((returns) => GetPlaylistItemByIdOutput)
  getPlaylistItemById(
    @AuthUser() user: User,
    @Args('input') input: GetPlaylistItemByIdInput,
  ): Promise<GetPlaylistItemByIdOutput> {
    return this.playlistItemService.getPlaylistItemById(user, input);
  }
}

@UseGuards(AppAuthGuard)
@Resolver()
export class RoomResolver {
  constructor(private readonly roomService: RoomService) {}
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

  @Mutation((returns) => CreateMsgOutput)
  createMsg(
    @AuthUser() user: User,
    @Args('input') input: CreateMsgInput,
  ): Promise<CreateMsgOutput> {
    return this.roomService.createMsg(user, input);
  }
}
