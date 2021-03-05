import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Common } from 'src/common/entities/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
@InputType({ isAbstract: true })
@ObjectType()
export class PlaylistItem extends Common {
  @Column()
  @Field((type) => String)
  originalLink: string;

  @Column()
  @Field((type) => String)
  kind: string = 'youtube#video';

  @Column()
  @Field((type) => String)
  title: string;

  @Column()
  @Field((type) => String)
  videoId: string;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  description?: string;

  @Column({ nullable: true })
  @Field((type) => String, { nullable: true })
  thumbnailImg?: string;
}
