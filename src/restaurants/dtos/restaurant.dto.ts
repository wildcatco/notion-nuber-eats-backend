import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class RestaurantInput {
  @Field((type) => Int)
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends BaseOutput {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
