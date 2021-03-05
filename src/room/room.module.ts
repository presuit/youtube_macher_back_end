import { Global, Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomResolver } from './room.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Msg } from './entities/msg.entity';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Room, Msg]), UserModule],
  providers: [RoomService, RoomResolver],
  exports: [RoomService],
})
export class RoomModule {}
