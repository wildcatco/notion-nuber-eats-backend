import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/core-output.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@InputType()
export class RestaurantInput {
  @Field((type) => Int)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
  @Field((type) => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
