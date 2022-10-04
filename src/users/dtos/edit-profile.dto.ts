import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from './../entities/user.entity';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password'] as const),
) {}

@ObjectType()
export class EditProfileOutput extends BaseOutput {}
