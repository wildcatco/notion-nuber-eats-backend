import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { BaseOutput } from '../../common/dtos/base-output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class UserProfileInput {
  @Field((type) => Number)
  @IsNumber()
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends BaseOutput {
  @Field((type) => User, { nullable: true })
  user?: User;
}
