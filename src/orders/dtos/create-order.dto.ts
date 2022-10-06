import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsArray, IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/core-output.dto';
import { OrderItemOption } from '../entities/order-item.entity';

@InputType()
class CreateOrderItemInput {
  @Field((type) => Int)
  @IsNumber()
  dishId: number;

  @Field((type) => [OrderItemOption], { nullable: true })
  @IsArray()
  options?: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field((type) => Int)
  @IsNumber()
  restaurantId: number;

  @Field((type) => [CreateOrderItemInput])
  @IsArray()
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
