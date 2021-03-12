import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateOrGetPlaylistItemInput,
  CreateOrGetPlaylistItemOutput,
} from '../dtos/playlistItem/createPlaylistItem.dto';
import {
  GetPlaylistItemByIdInput,
  GetPlaylistItemByIdOutput,
} from '../dtos/playlistItem/getPlaylistItemById.dto';
import { PlaylistItem } from '../entities/playlistItem.entity';
import { GET_YOUTUBE_VIDEO_URL } from '../room.constant';

@Injectable()
export class PlaylistItemService {
  constructor(
    @InjectRepository(PlaylistItem)
    private readonly playlistItems: Repository<PlaylistItem>,
  ) {}

  async fetchPlaylistItemFromYoutube(
    user: User,
    playlistItem: PlaylistItem,
  ): Promise<CommonOutput> {
    try {
      const response = await axios.get(
        `${GET_YOUTUBE_VIDEO_URL}/?part=snippet&id=${playlistItem.videoId}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      if (response.status === 200 && response.data.items.length !== 0) {
        const kind = response.data.kind;
        const videoSnippet = response.data.items[0].snippet;
        const title = videoSnippet.title;
        const description = videoSnippet.description;
        const thumbnailImg = videoSnippet.thumbnails.default.url;
        let updated = false;

        if (kind !== playlistItem.kind) {
          playlistItem.kind = kind;
          updated = true;
        }

        if (title !== playlistItem.title) {
          playlistItem.title = title;
          updated = true;
        }
        if (description !== playlistItem.description) {
          playlistItem.description = description;
          updated = true;
        }
        if (thumbnailImg !== playlistItem.thumbnailImg) {
          playlistItem.thumbnailImg = thumbnailImg;
          updated = true;
        }

        if (updated) {
          await this.playlistItems.save(playlistItem);
        }
        return { ok: true };
      } else {
        return {
          ok: false,
          error: 'youtube api went wrong on updatePlaylistItem',
        };
      }
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

  async parseLink(
    link: string,
  ): Promise<{
    ok: boolean;
    error?: string;
    videoId?: string;
  }> {
    try {
      const validateYoutubeUrl_1 = link.includes(
        'https://www.youtube.com/watch',
      );
      const validateYoutubeUrl_2 = link.includes('https://youtu.be');

      let videoId: string;

      if (validateYoutubeUrl_1) {
        videoId = link.split('&')[0].split('v=')[1];
      } else if (validateYoutubeUrl_2) {
        const tokens = link.split('/');
        videoId = tokens[tokens.length - 1];
      } else {
        return { ok: false, error: 'Your link does not have youtube address' };
      }

      return { ok: true, videoId };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async createOrGetPlaylistItem(
    user: User,
    { link }: CreateOrGetPlaylistItemInput,
  ): Promise<CreateOrGetPlaylistItemOutput> {
    try {
      const { ok, error, videoId } = await this.parseLink(link);

      if (!ok) {
        return { ok, error };
      }

      if (videoId === '' || !videoId) {
        return { ok: false, error: 'No videoId exists' };
      }

      let playlistItem = await this.playlistItems.findOne({ videoId });
      if (playlistItem) {
        return { ok: true, playlistItem };
      }

      // or create new one

      const response = await axios.get(
        `${GET_YOUTUBE_VIDEO_URL}/?part=snippet&id=${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      if (response.status === 200 && response.data.items.length !== 0) {
        const videoSnippet = response.data.items[0].snippet;
        const title = videoSnippet.title;
        const description = videoSnippet.description;
        const thumbnailImg = videoSnippet.thumbnails.default.url;

        playlistItem = this.playlistItems.create({
          description,
          originalLink: link,
          thumbnailImg,
          title,
          videoId,
          kind: response.data.kind,
        });

        await this.playlistItems.save(playlistItem);
      } else {
        return {
          ok: false,
          error: 'Failed to create playlist with youtube api',
        };
      }

      return { ok: true, playlistItem };
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

  async getPlaylistItemById(
    user: User,
    { id, fetchYoutube }: GetPlaylistItemByIdInput,
  ): Promise<GetPlaylistItemByIdOutput> {
    try {
      const playlistItem = await this.playlistItems.findOneOrFail(id);
      if (fetchYoutube) {
        const { ok, error } = await this.fetchPlaylistItemFromYoutube(
          user,
          playlistItem,
        );
        if (!ok) {
          return { ok, error };
        }
      }
      return { ok: true, playlistItem };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
