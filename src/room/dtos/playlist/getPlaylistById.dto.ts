import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CommonOutput } from 'src/common/dtos/commonOutput.dto';
import { Playlist, PlaylistRelations } from 'src/room/entities/playlist.entity';

@InputType()
export class GetPlaylistByIdInput extends PickType(Playlist, ['id']) {
  @Field((type) => [PlaylistRelations], { nullable: true })
  relations?: PlaylistRelations[];
}

@ObjectType()
export class GetPlaylistByIdOutput extends CommonOutput {
  @Field((type) => Playlist, { nullable: true })
  playlist?: Playlist;
}
