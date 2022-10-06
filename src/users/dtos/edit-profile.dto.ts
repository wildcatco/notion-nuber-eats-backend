import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/core-output.dto';
import { User } from './../entities/user.entity';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password'] as const),
) {}

@ObjectType()
export class EditProfileOutput extends CoreOutput {}
