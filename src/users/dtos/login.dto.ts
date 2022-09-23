import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutputDto } from 'src/common/dtos/output.dto';
import { User } from './../entities/user.entity';

@InputType()
export class LoginInput extends PickType(User, [
  'email',
  'password',
] as const) {}

@ObjectType()
export class LoginOutput extends CoreOutputDto {
  @Field((type) => String, { nullable: true })
  token?: string;
}
