import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
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
import { Playlist, PlaylistRelations } from '../entities/playlist.entity';
import { PlaylistItem } from '../entities/playlistItem.entity';
import { RoomRelations } from '../entities/room.entity';
import { PLAY_LIST_ITEM_URL, PLAY_LIST_URL } from '../playlist.constant';
import { PlaylistItemService } from './playlistItem.service';
import { RoomService } from './room.service';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlists: Repository<Playlist>,
    private readonly playlistItemService: PlaylistItemService,
    private readonly roomService: RoomService,
  ) {}

  async fetchPlaylistFromYoutube(
    user: User,
    playlist: Playlist,
  ): Promise<{
    ok: boolean;
    error?: string;
    youtubePlaylistItems?: { playlistItemId: string; videoId: string }[];
  }> {
    try {
      const container: { playlistItemId: string; videoId: string }[] = [];
      while (true) {
        let response = await axios.get(
          `${PLAY_LIST_ITEM_URL}/?part=snippet&playlistId=${playlist.playlistId}&maxResults=50`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          },
        );
        if (response.status === 200 && response.data.items.length !== 0) {
          for (const item of response.data.items) {
            const playlistItemId = item.id;
            const videoId = item.snippet.resourceId.videoId;
            if (!playlistItemId || !videoId) {
              return {
                ok: false,
                error: 'youtube api, playlist.list went wrong',
              };
            }
            const data = { playlistItemId, videoId };
            container.push(data);
          }
        }
        if (response.data.nextPageToken) {
          response = await axios.get(
            `${PLAY_LIST_ITEM_URL}/?part=snippet&playlistId=${playlist.playlistId}&maxResults=50&pageToken=${response.data.nextPageToken}`,
            {
              headers: {
                Authorization: `Bearer ${user.accessToken}`,
              },
            },
          );
        } else {
          break;
        }
      }
      return { ok: true, youtubePlaylistItems: container };
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

  async synchronizeLocalToYoutube(
    user: User,
    playlist: Playlist,
    updateContainer: PlaylistItem[],
  ): Promise<CommonOutput> {
    try {
      let i: number;
      const {
        error,
        ok,
        youtubePlaylistItems,
      } = await this.fetchPlaylistFromYoutube(user, playlist);

      if (!ok) {
        return { ok, error };
      }

      // insert updateContainer to youtube playlist
      for (i = 0; i < updateContainer.length; i++) {
        // 아직 i가 youtubeplaylistItems 범위 내에 있을 때는, 각각의 값들이 똑같은지 확인하고 똑같으면 다음으로 넘어가고, 아니면 삭제하고 그 자리에 updateContainer[i]를 집어 넣으면 된다.
        if (
          i < youtubePlaylistItems.length &&
          updateContainer[i].videoId === youtubePlaylistItems[i].videoId
        ) {
          continue;
        } else if (
          i < youtubePlaylistItems.length &&
          updateContainer[i].videoId !== youtubePlaylistItems[i].videoId
        ) {
          const response = await axios.delete(
            `${PLAY_LIST_ITEM_URL}/?id=${youtubePlaylistItems[i].playlistItemId}`,
            {
              headers: {
                Authorization: `Bearer ${user.accessToken}`,
              },
            },
          );
          if (response.status !== 204) {
            return { ok: false, error: 'delete youtube side video failed' };
          }
        }
        const data = {
          snippet: {
            playlistId: playlist.playlistId,
            ...(i < youtubePlaylistItems.length && { position: i }),
            resourceId: {
              kind: 'youtube#video',
              videoId: updateContainer[i].videoId,
            },
          },
        };
        const response = await axios.post(
          `${PLAY_LIST_ITEM_URL}/?part=snippet`,
          data,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          },
        );

        if (response.status !== 200) {
          return {
            ok: false,
            error: 'error on pushing updatedPlaylistItems to youtube playlist',
          };
        }
      }

      for (let j = i; j < youtubePlaylistItems.length; j++) {
        const response = await axios.delete(
          `${PLAY_LIST_ITEM_URL}/?id=${youtubePlaylistItems[j].playlistItemId}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          },
        );
        if (response.status !== 204) {
          return { ok: false, error: 'delete youtube side video failed' };
        }
      }

      playlist.playlistItems = [...updateContainer];
      await this.playlists.save(playlist);

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

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
        relations: [RoomRelations.participants, RoomRelations.playlistItems],
      });

      if (!roomOk) {
        return { ok: roomOk, error: roomError };
      }

      if (!room.playlistItems || room.playlistItems.length == 0) {
        return {
          ok: false,
          error: "Your room's playlistItems are empty",
        };
      }

      for (const id of playlistItemIds) {
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
        } = await this.playlistItemService.getPlaylistItemById(user, { id });
        if (!ok) {
          return { ok, error };
        }
        container.push(playlistItem);
      }

      let playlist = this.playlists.create({
        title,
        ...(description && { description }),
        owner: user,
        playlistItems: container,
      });

      const data = {
        snippet: {
          title,
          ...(description && { description }),
        },
      };

      // create playlist
      const response = await axios.post(
        `${PLAY_LIST_URL}/?part=snippet`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      );

      const playlistId = response.data.id;

      if (!playlistId) {
        return {
          ok: false,
          error: 'Youtube api went wrong on createPlaylist check it out',
        };
      }

      playlist.playlistId = playlistId;

      // attach playlistItems to playlist that just created
      for (const item of playlist.playlistItems) {
        const data = {
          snippet: {
            playlistId: playlist.playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: item.videoId,
            },
          },
        };
        const response = await axios.post(
          `${PLAY_LIST_ITEM_URL}/?part=snippet`,
          data,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          },
        );
        console.log(response.status);
        // todo:
        // when some data went wrong, then show some error
      }

      await this.playlists.save(playlist);
      return { ok: true, playlistId: playlist.id };
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

  async getPlaylistById(
    user: User,
    { relations, id }: GetPlaylistByIdInput,
  ): Promise<GetPlaylistByIdOutput> {
    try {
      const playlist = await this.playlists.findOneOrFail(id, {
        ...(relations && { relations: [...relations] }),
      });
      return { ok: true, playlist };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async updatePlaylist(
    user: User,
    { id, title, playlistItemIds, description, roomId }: UpdatePlaylistInput,
  ): Promise<UpdatePlaylistOutput> {
    try {
      const {
        ok: findRoomOk,
        error: findRoomError,
        room,
      } = await this.roomService.findRoomById({
        id: roomId,
        relations: [RoomRelations.playlistItems],
      });

      if (!findRoomOk) {
        return { ok: findRoomOk, error: findRoomError };
      }

      const { ok, error, playlist } = await this.getPlaylistById(user, {
        id,
        relations: [PlaylistRelations.playlistItems],
      });

      if (!ok) {
        return { ok, error };
      }

      let updated = false;

      if (title && title !== playlist.title) {
        playlist.title = title;
        updated = true;
      }

      if (description && description !== playlist.description) {
        playlist.description = description;
        updated = true;
      }

      if (playlistItemIds && playlistItemIds.length !== 0) {
        for (const item of playlistItemIds) {
          const existOnRoom = room.playlistItems.find(
            (each) => each.id === item,
          );
          if (!existOnRoom) {
            return {
              ok: false,
              error:
                'You just added some playlistItem that does not exist on the room',
            };
          }
        }

        const updatedContainer: PlaylistItem[] = [];
        for (const id of playlistItemIds) {
          const {
            ok,
            error,
            playlistItem,
          } = await this.playlistItemService.getPlaylistItemById(user, { id });
          if (!ok) {
            return { ok, error };
          }
          updatedContainer.push(playlistItem);
        }

        if (updatedContainer && updatedContainer.length !== 0) {
          const { error, ok } = await this.synchronizeLocalToYoutube(
            user,
            playlist,
            updatedContainer,
          );

          if (!ok) {
            return { ok, error };
          }
        }
      }

      if (updated) {
        const data = {
          id: playlist.playlistId,
          snippet: {
            title: playlist.title,
            ...(playlist.description && { description: playlist.description }),
          },
        };
        const responseOfUpdate = await axios.put(
          `${PLAY_LIST_URL}/?part=snippet`,
          data,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          },
        );

        if (responseOfUpdate.status !== 200) {
          return {
            ok: false,
            error: 'Update playlist went wrong when put method working',
          };
        }

        await this.playlists.save(playlist);
      }
      return { ok: true };
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

  // async synchronizeYoutubeToLocal(
  //   user: User,
  //   playlist: Playlist,
  //   videoIdContainer: string[],
  // ): Promise<CommonOutput> {
  //   // youtube와 playlist.playlistItems를 서로 동기화 시킴

  //   let i: number;

  //   for (i = 0; i < videoIdContainer.length; i++) {
  //     const target = videoIdContainer[i];
  //     let index = -1;

  //     for (let _index = i; _index < playlist.playlistItems.length; _index++) {
  //       if (target === playlist.playlistItems[_index].videoId) {
  //         index = _index;
  //         break;
  //       }
  //     }

  //     if (index > -1 && i < playlist.playlistItems.length) {
  //       if (index !== i) {
  //         const temp = playlist.playlistItems[i];
  //         playlist.playlistItems[i] = playlist.playlistItems[index];
  //         playlist.playlistItems[index] = temp;
  //       }
  //     } else {
  //       const link = `https://youtu.be/${target}`;
  //       const {
  //         ok,
  //         error,
  //         playlistItem,
  //       } = await this.playlistItemService.createOrGetPlaylistItem(user, {
  //         link,
  //       });
  //       if (!ok) {
  //         return { ok: false, error };
  //       }
  //       const temp = playlist.playlistItems[i];
  //       if (!temp) {
  //         playlist.playlistItems[i] = playlistItem;
  //       } else {
  //         playlist.playlistItems[i] = playlistItem;
  //         playlist.playlistItems.push(temp);
  //       }
  //       console.log(playlist.playlistItems);
  //     }
  //   }

  //   playlist.playlistItems = playlist.playlistItems.slice(0, i);

  //   await this.playlists.save(playlist);

  //   return { ok: true };
  // }

  // async fetchPlaylistFromYoutube(
  //   user: User,
  //   playlist: Playlist,
  // ): Promise<CommonOutput> {
  //   // synchronize one youtube playlist and db's playlist entity
  //   try {
  //     const response = await axios.get(
  //       `${PLAY_LIST_URL}/?part=snippet&id=${playlist.playlistId}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${user.accessToken}`,
  //         },
  //       },
  //     );

  //     if (response.status === 200 && response.data.items.length !== 0) {
  //       const playlistSnippet = response.data.items[0].snippet;
  //       const title = playlistSnippet.title;
  //       const description = playlistSnippet.description;
  //       let updated = false;

  //       if (title && playlist.title !== title) {
  //         playlist.title = title;
  //         updated = true;
  //       }

  //       if (description && playlist.description !== description) {
  //         playlist.description = description;
  //         updated = true;
  //       }

  //       // check if playlistItems are different from api and db
  //       let playlistItemsResponse = await axios.get(
  //         `${PLAY_LIST_ITEM_URL}/?part=snippet&maxResults=50&playlistId=${playlist.playlistId}`,
  //         { headers: { Authorization: `Bearer ${user.accessToken}` } },
  //       );

  //       if (
  //         playlistItemsResponse.status === 200 &&
  //         playlistItemsResponse.data.items.length === 0
  //       ) {
  //         playlist.playlistItems = [];
  //         updated = true;
  //       } else if (
  //         playlistItemsResponse.status === 200 &&
  //         playlistItemsResponse.data.items.length !== 0
  //       ) {
  //         const videoIdFromYoutube: string[] = [];
  //         while (true) {
  //           for (const item of playlistItemsResponse.data.items) {
  //             const playlistItemSnippet = item.snippet;
  //             const videoId = playlistItemSnippet.resourceId.videoId;
  //             if (videoId) {
  //               videoIdFromYoutube.push(videoId);
  //             }
  //           }
  //           if (playlistItemsResponse.data.nextPageToken) {
  //             playlistItemsResponse = await axios.get(
  //               `${PLAY_LIST_ITEM_URL}/?part=snippet&maxResults=50&pageToken=${playlistItemsResponse.data.nextPageToken}&playlistId=${playlist.playlistId}`,
  //               { headers: { Authorization: `Bearer ${user.accessToken}` } },
  //             );
  //             continue;
  //           } else {
  //             break;
  //           }
  //         }

  //         const { ok, error } = await this.synchronizeYoutubeToLocal(
  //           user,
  //           playlist,
  //           videoIdFromYoutube,
  //         );
  //         if (!ok) {
  //           return { ok, error };
  //         }
  //       }

  //       if (updated) {
  //         await this.playlists.save(playlist);
  //       }

  //       return { ok: true };
  //     }
  //     return { ok: false, error: 'Youtube api went wrong on updatePlaylist' };
  //   } catch (error) {
  //     console.log(error);
  //     return { ok: false, error };
  //   }
  // }
}
