import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Room, RoomRelations } from '../entities/room.entity';

@InputType()
export class FindRoomByIdInput extends PickType(Room, ['id']) {
  @Field((type) => [RoomRelations], { nullable: true })
  relations?: RoomRelations[];
}

@ObjectType()
export class FindRoomByIdOutput extends CommonOutput {
  @Field((type) => Room, { nullable: true })
  room?: Room;
}
