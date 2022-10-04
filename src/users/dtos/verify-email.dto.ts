import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Verification } from '../entities/verification.entity';

@InputType()
export class VerifyEmailInput extends PickType(Verification, [
  'code',
] as const) {}

@ObjectType()
export class VerifyEmailOutput extends BaseOutput {}
