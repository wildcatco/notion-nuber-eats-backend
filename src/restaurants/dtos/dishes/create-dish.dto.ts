import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/core-output.dto';
import { Dish } from '../../entities/dish.entity';

@InputType()
export class CreateDishInput extends PickType(Dish, [
  'name',
  'price',
  'description',
  'options',
]) {
  @Field((type) => Int)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
