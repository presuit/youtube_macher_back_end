import {
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Room } from '../entities/room.entity';

@InputType()
export class UpdateRoomInput extends PartialType(PickType(Room, ['name'])) {
  @Field((type) => Int)
  roomId: number;

  @Field((type) => [Int], { nullable: true })
  banUserIds?: number[];
}

@ObjectType()
export class UpdateRoomOutput extends CommonOutput {}
