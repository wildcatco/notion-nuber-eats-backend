import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from '../../common/dtos/core-output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class UserProfileInput {
  @Field((type) => Number)
  @IsNumber()
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput {
  @Field((type) => User, { nullable: true })
  user?: User;
}
