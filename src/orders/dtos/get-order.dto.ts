import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from 'src/orders/entities/order.entity';
import { CoreOutput } from '../../common/dtos/core-output.dto';

@InputType()
export class GetOrderInput extends PickType(Order, ['id']) {}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field((type) => Order, { nullable: true })
  order?: Order;
}
