import {
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Room } from 'src/room/entities/room.entity';

@InputType()
export class UpdateRoomInput extends PartialType(PickType(Room, ['name'])) {
  @Field((type) => Int)
  roomId: number;

  @Field((type) => [Int], { nullable: true })
  banUserIds?: number[];

  @Field((type) => [Int], { nullable: true })
  unbanUserIds?: number[];
}

@ObjectType()
export class UpdateRoomOutput extends CommonOutput {}
