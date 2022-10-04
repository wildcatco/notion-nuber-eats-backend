import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from 'src/common/entities/base.entity';
import { BeforeInsert, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { v4 as uuid4 } from 'uuid';
import { User } from './user.entity';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends BaseEntity {
  @Column()
  @Field((type) => String)
  code: string;

  @OneToOne((type) => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @BeforeInsert()
  createCode(): void {
    this.code = uuid4();
  }
}
