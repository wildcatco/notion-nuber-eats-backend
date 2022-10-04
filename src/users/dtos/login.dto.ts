import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from './../entities/user.entity';

@InputType()
export class LoginInput extends PickType(User, [
  'email',
  'password',
] as const) {}

@ObjectType()
export class LoginOutput extends BaseOutput {
  @Field((type) => String, { nullable: true })
  token?: string;
}
