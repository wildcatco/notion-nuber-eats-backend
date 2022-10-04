import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { BaseOutput } from '../../common/dtos/base-output.dto';
import { Restaurant } from './../entities/restaurant.entity';

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
  'name',
  'coverImg',
  'address',
]) {
  @Field((type) => String)
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends BaseOutput {}
