import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreOutput } from '../../../common/dtos/core-output.dto';
import { Restaurant } from '../../entities/restaurant.entity';

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
  'name',
  'coverImg',
  'address',
]) {
  @Field((type) => String)
  @IsString()
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {}
