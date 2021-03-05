import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { User, UserRelations } from '../entities/user.entity';

@InputType()
export class FindUserByIdInput extends PickType(User, ['id']) {
  @Field((type) => [UserRelations], { nullable: true })
  relations?: UserRelations[];
}

@ObjectType()
export class FindUserByIdOutput extends CommonOutput {
  @Field((type) => User, { nullable: true })
  user?: User;
}
