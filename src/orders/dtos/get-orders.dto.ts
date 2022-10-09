import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { CoreOutput } from '../../common/dtos/core-output.dto';

@InputType()
export class GetOrdersInput {
  @Field((type) => OrderStatus, { nullable: true })
  status?: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends CoreOutput {
  @Field((type) => [Order], { nullable: true })
  orders?: Order[];
}
