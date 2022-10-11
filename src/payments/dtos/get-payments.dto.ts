import { Field, ObjectType } from '@nestjs/graphql';
import { Payment } from 'src/payments/entities/payment.entity';
import { CoreOutput } from './../../common/dtos/core-output.dto';

@ObjectType()
export class GetPaymentsOutput extends CoreOutput {
  @Field((type) => [Payment], { nullable: true })
  payments?: Payment[];
}
