import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';

@InputType()
export class CreateOrGetPlaylistItemInput {
  @Field((type) => String)
  link: string;
}

@ObjectType()
export class CreateOrGetPlaylistItemOutput extends CommonOutput {
  @Field((type) => Int, { nullable: true })
  playlistItemId?: number;
}
