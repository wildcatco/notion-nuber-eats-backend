import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { BaseOutput } from '../../common/dtos/base-output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'role',
] as const) {}

@ObjectType()
export class CreateAccountOutput extends BaseOutput {}
