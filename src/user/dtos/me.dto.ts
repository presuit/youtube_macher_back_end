import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { User, UserRelations } from '../entities/user.entity';

@InputType()
export class MeInput {
  @Field((type) => [UserRelations], { nullable: true })
  relations?: UserRelations[];
}

@ObjectType()
export class MeOutput extends CommonOutput {
  @Field((type) => User, { nullable: true })
  me?: User;
}
