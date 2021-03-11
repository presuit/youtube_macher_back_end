import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Room } from 'src/room/entities/room.entity';

@InputType()
export class CreateInviteCodeInput extends PickType(Room, ['id']) {}

@ObjectType()
export class CreateInviteCodeOutput extends CommonOutput {
  @Field((type) => String, { nullable: true })
  inviteCode?: string;
}
