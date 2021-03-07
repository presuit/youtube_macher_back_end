import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Playlist } from '../../entities/playlist.entity';

@InputType()
export class CreatePlaylistInput extends PickType(Playlist, ['title']) {
  @Field((type) => [Int])
  playlistItemIds: number[];

  @Field((type) => String, { nullable: true })
  description?: string;

  @Field((type) => Int)
  roomId: number;
}

@ObjectType()
export class CreatePlaylistOutput extends CommonOutput {
  @Field((type) => Int, { nullable: true })
  playlistId?: number;
}
