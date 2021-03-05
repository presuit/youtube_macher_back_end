import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { extend } from '@nestjs/graphql/dist/utils';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { PlaylistItem } from '../entities/playlistItem.entity';

@InputType()
export class GetPlaylistItemByIdInput extends PickType(PlaylistItem, ['id']) {}

@ObjectType()
export class GetPlaylistItemByIdOutput extends CommonOutput {
  @Field((type) => PlaylistItem, { nullable: true })
  playlistItem?: PlaylistItem;
}
