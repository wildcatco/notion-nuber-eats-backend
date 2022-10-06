import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/core-output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
] as const) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
