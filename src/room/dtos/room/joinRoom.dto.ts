import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';

@InputType()
export class JoinRoomInput {
  @Field((type) => Int)
  roomId: number;
}

@ObjectType()
export class JoinRoomOutput extends CommonOutput {}
