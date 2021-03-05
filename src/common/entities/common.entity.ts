import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@InputType({ isAbstract: true })
@ObjectType()
export class Common {
  @PrimaryGeneratedColumn()
  @Field((type) => Int)
  id: number;

  @UpdateDateColumn()
  @Field((type) => Date)
  updatedAt: Date;

  @CreateDateColumn()
  @Field((type) => Date)
  createdAt: Date;
}
