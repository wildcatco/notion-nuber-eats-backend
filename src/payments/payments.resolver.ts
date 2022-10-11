import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

@Resolver((of) => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation((returns) => CreatePaymentOutput)
  @Roles('Owner')
  createPayment(
    @AuthUser() authUser: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return this.paymentsService.createPayment(authUser, createPaymentInput);
  }

  @Query((returns) => GetPaymentsOutput)
  @Roles('Owner')
  getPayments(@AuthUser() authUser: User): Promise<GetPaymentsOutput> {
    return this.paymentsService.getPayments(authUser);
  }
}
