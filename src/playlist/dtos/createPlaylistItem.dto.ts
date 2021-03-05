import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';

@InputType()
export class CreatePlaylistItemInput {
  @Field((type) => String)
  link: string;
}

@ObjectType()
export class CreatePlaylistItemOutput extends CommonOutput {
  @Field((type) => Int, { nullable: true })
  playlistItemId?: number;
}
