import { All, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { User } from 'src/user/entities/user.entity';
import { CreateRoomInput, CreateRoomOutput } from './dtos/createRoom.dto';
import { DeleteRoomInput, DeleteRoomOutput } from './dtos/deleteRoom.dto';
import { FindRoomByIdInput, FindRoomByIdOutput } from './dtos/findRoomById.dto';
import { UpdateRoomInput, UpdateRoomOutput } from './dtos/updateRoom.dto';
import { RoomService } from './room.service';

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
}
