import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Payment } from 'src/payments/entities/payment.entity';
import { CoreOutput } from './../../common/dtos/core-output.dto';

@InputType()
export class CreatePaymentInput extends PickType(Payment, [
  'transactionId',
  'restaurantId',
]) {}

@ObjectType()
export class CreatePaymentOutput extends CoreOutput {}
