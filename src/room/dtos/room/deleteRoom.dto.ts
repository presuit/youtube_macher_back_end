import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Room } from 'src/room/entities/room.entity';

@InputType()
export class DeleteRoomInput extends PickType(Room, ['id']) {}

@ObjectType()
export class DeleteRoomOutput extends CommonOutput {}
