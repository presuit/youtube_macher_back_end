import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Room } from '../entities/room.entity';

@InputType()
export class CreateRoomInput extends PickType(Room, ['name']) {}

@ObjectType()
export class CreateRoomOutput extends CommonOutput {
  @Field((type) => Int, { nullable: true })
  roomId?: number;
}
