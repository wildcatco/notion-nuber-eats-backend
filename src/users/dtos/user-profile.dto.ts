import { ArgsType, Field, ObjectType } from '@nestjs/graphql';
import { BaseOutput } from '../../common/dtos/base-output.dto';
import { User } from '../entities/user.entity';

@ArgsType()
export class UserProfileInput {
  @Field((type) => Number)
  userId: number;
}

@ObjectType()
export class UserProfileOutput extends BaseOutput {
  @Field((type) => User, { nullable: true })
  user?: User;
}
