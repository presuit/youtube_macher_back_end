import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Msg } from '../../entities/msg.entity';

@InputType()
export class CreateMsgInput extends PickType(Msg, ['text']) {
  @Field((type) => Int)
  roomId: number;
}

@ObjectType()
export class CreateMsgOutput extends CommonOutput {
  @Field((type) => Int, { nullable: true })
  msgId?: number;
}
