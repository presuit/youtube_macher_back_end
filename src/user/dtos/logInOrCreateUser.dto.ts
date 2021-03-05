import { Field, InputType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';

@InputType()
export class LogInOrCreateUserOutput extends CommonOutput {
  @Field((type) => String, { nullable: true })
  authToken?: string;
}
