import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { User } from 'src/user/entities/user.entity';
import {
  CreateOrGetPlaylistItemInput,
  CreateOrGetPlaylistItemOutput,
} from '../dtos/playlistItem/createPlaylistItem.dto';
import {
  GetPlaylistItemByIdInput,
  GetPlaylistItemByIdOutput,
} from '../dtos/playlistItem/getPlaylistItemById.dto';
import { PlaylistItemService } from '../services/playlistItem.service';

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
