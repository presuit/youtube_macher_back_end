import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { PlaylistItem } from 'src/room/entities/playlistItem.entity';

@InputType()
export class GetPlaylistItemByIdInput extends PickType(PlaylistItem, ['id']) {
  @Field((type) => Boolean, { nullable: true })
  fetchYoutube?: boolean;
}

@ObjectType()
export class GetPlaylistItemByIdOutput extends CommonOutput {
  @Field((type) => PlaylistItem, { nullable: true })
  playlistItem?: PlaylistItem;
}
