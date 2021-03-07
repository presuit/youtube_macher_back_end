import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { JwtModule } from './jwt/jwt.module';
import { Msg } from './room/entities/msg.entity';
import { Playlist } from './room/entities/playlist.entity';
import { PlaylistItem } from './room/entities/playlistItem.entity';
import { Room } from './room/entities/room.entity';
import { RoomModule } from './room/room.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: (context) => {},
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '0505',
      database: 'youtube_api_practice',
      entities: [User, Room, Msg, Playlist, PlaylistItem],
      synchronize: true,
    }),
    UserModule,
    CommonModule,
    JwtModule.forRoot({ jwtSecret: 'dgoJjbVEaC1ZXx1du2fORoRsCeIL7Qoq' }),
    RoomModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
