import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import {
  CreatePlaylistItemInput,
  CreatePlaylistItemOutput,
} from './dtos/createPlaylistItem.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PlaylistItem } from './entities/playlistItem.entity';
import { Repository } from 'typeorm';
import { GET_YOUTUBE_VIDEO_URL } from './playlist.constant';
import axios from 'axios';
import { Playlist } from './entities/playlist.entity';
import {
  CreatePlaylistInput,
  CreatePlaylistOutput,
} from './dtos/createPlaylist.dto';
import {
  GetPlaylistItemByIdInput,
  GetPlaylistItemByIdOutput,
} from './dtos/getPlaylistItemById.dto';
import { RoomService } from 'src/room/room.service';
import { RoomRelations } from 'src/room/entities/room.entity';

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
    title?: string;
    description?: string;
    thumbnailImg?: string;
    videoId?: string;
  }> {
    try {
      const validateYoutubeUrl = link.includes('https://www.youtube.com/watch');

      if (!validateYoutubeUrl) {
        return { ok: false, error: 'Your link does not have youtube address' };
      }

      const videoId = link.split('&')[0].split('v=')[1];

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

      return { ok: true, title, description, thumbnailImg, videoId };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async createPlaylistItem(
    user: User,
    { link }: CreatePlaylistItemInput,
  ): Promise<CreatePlaylistItemOutput> {
    try {
      const {
        ok,
        error,
        title,
        thumbnailImg,
        description,
        videoId,
      } = await this.parseLink(link, user);

      if (!ok) {
        return { ok, error };
      }

      let playlistItem = await this.playlistItems.findOne({ videoId });
      if (playlistItem) {
        return { ok: false, error: 'Already Exists PlaylistItem Error' };
      }

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
        relations: [RoomRelations.participants],
      });

      if (!roomOk) {
        return { ok: roomOk, error: roomError };
      }

      for (const id of playlistItemIds) {
        if (!room.playlistItems) {
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

      let playlist = await this.playlists.findOne({ title });

      if (playlist) {
        return {
          ok: false,
          error: "Already  exists playlist's title, rename it",
        };
      }

      playlist = this.playlists.create({
        title,
        ...(description && { description }),
        owner: user,
        playlistItems: container,
      });

      await this.playlists.save(playlist);
      return { ok: true, playlistId: playlist.id };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
