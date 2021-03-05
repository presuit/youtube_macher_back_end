import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePlaylistInput,
  CreatePlaylistOutput,
} from './dtos/createPlaylist.dto';
import {
  CreatePlaylistItemInput,
  CreatePlaylistItemOutput,
} from './dtos/createPlaylistItem.dto';
import {
  GetPlaylistItemByIdInput,
  GetPlaylistItemByIdOutput,
} from './dtos/getPlaylistItemById.dto';
import { PlaylistItem } from './entities/playlistItem.entity';
import { PlaylistItemService, PlaylistService } from './playlist.service';

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
}

@UseGuards(AppAuthGuard)
@Resolver()
export class PlaylistItemResolver {
  constructor(private readonly playlistItemService: PlaylistItemService) {}

  @AllowedPermission('LogIn')
  @Mutation((returns) => CreatePlaylistItemOutput)
  createPlaylistItem(
    @AuthUser() user: User,
    @Args('input') input: CreatePlaylistItemInput,
  ): Promise<CreatePlaylistItemOutput> {
    return this.playlistItemService.createPlaylistItem(user, input);
  }

  @AllowedPermission('LogIn')
  @Query((returns) => GetPlaylistItemByIdOutput)
  getPlaylistItemById(
    @Args('input') input: GetPlaylistItemByIdInput,
  ): Promise<GetPlaylistItemByIdOutput> {
    return this.playlistItemService.getPlaylistItemById(input);
  }
}
