import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Common } from 'src/common/entities/common.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Room } from './room.entity';

@Entity()
@InputType({ isAbstract: true })
@ObjectType()
export class Msg extends Common {
  @Column()
  @Field((type) => String)
  text: string;

  @Column()
  @Field((type) => Int)
  fromId: number;

  // relations
  @ManyToOne((type) => Room, (room) => room.msgs, { onDelete: 'CASCADE' })
  @Field((type) => Room)
  room: Room;

  @RelationId((msg: Msg) => msg.room)
  roomId: number;
}
