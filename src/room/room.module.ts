import { Global, Module } from '@nestjs/common';
import {
  PlaylistItemService,
  PlaylistService,
  RoomService,
} from './room.service';
import {
  PlaylistItemResolver,
  PlaylistResolver,
  RoomResolver,
} from './room.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Msg } from './entities/msg.entity';
import { UserModule } from 'src/user/user.module';
import { Playlist } from './entities/playlist.entity';
import { PlaylistItem } from './entities/playlistItem.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Msg, Playlist, PlaylistItem]),
    UserModule,
  ],
  providers: [
    RoomService,
    RoomResolver,
    PlaylistResolver,
    PlaylistItemResolver,
    PlaylistService,
    PlaylistItemService,
  ],
  exports: [RoomService, PlaylistService, PlaylistItemService],
})
export class RoomModule {}
