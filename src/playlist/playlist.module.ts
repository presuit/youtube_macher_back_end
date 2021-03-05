import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from 'src/room/room.module';
import { RoomService } from 'src/room/room.service';
import { Playlist } from './entities/playlist.entity';
import { PlaylistItem } from './entities/playlistItem.entity';
import { PlaylistItemResolver, PlaylistResolver } from './playlist.resolver';
import { PlaylistItemService, PlaylistService } from './playlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlaylistItem, Playlist]), RoomModule],
  providers: [
    PlaylistResolver,
    PlaylistItemResolver,
    PlaylistService,
    PlaylistItemService,
  ],
})
export class PlaylistModule {}
