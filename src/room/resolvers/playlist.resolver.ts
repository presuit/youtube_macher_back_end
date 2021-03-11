import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { User } from 'src/user/entities/user.entity';
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
import { PlaylistService } from '../services/playlist.service';

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
  updatePlaylist(
    @AuthUser() user: User,
    @Args('input') input: UpdatePlaylistInput,
  ): Promise<UpdatePlaylistOutput> {
    return this.playlistService.updatePlaylist(user, input);
  }
}
