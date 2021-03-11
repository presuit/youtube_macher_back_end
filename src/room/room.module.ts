import { Global, Module } from '@nestjs/common';
import { RoomService } from './services/room.service';
import { RoomResolver } from './resolvers/room.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Msg } from './entities/msg.entity';
import { UserModule } from 'src/user/user.module';
import { Playlist } from './entities/playlist.entity';
import { PlaylistItem } from './entities/playlistItem.entity';
import { PlaylistService } from './services/playlist.service';
import { PlaylistItemService } from './services/playlistItem.service';
import { PlaylistResolver } from './resolvers/playlist.resolver';
import { PlaylistItemResolver } from './resolvers/playlistItem.resolver';

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
