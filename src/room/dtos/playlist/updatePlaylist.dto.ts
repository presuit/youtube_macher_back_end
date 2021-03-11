import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Playlist } from 'src/room/entities/playlist.entity';

@InputType()
export class UpdatePlaylistInput extends PickType(Playlist, ['id']) {
  @Field((type) => [Int], { nullable: true })
  playlistItemIds?: number[];

  @Field((type) => String, { nullable: true })
  title?: string;

  @Field((type) => String, { nullable: true })
  description?: string;

  @Field((type) => Int)
  roomId: number;
}

@ObjectType()
export class UpdatePlaylistOutput extends CommonOutput {}
