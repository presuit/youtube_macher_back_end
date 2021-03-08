import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { PlaylistItem } from 'src/room/entities/playlistItem.entity';

@InputType()
export class CreateOrGetPlaylistItemInput {
  @Field((type) => String)
  link: string;
}

@ObjectType()
export class CreateOrGetPlaylistItemOutput extends CommonOutput {
  @Field((type) => PlaylistItem, { nullable: true })
  playlistItem?: PlaylistItem;
}
