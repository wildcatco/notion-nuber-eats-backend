import {
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Dish } from './../entities/dish.entity';

@InputType()
export class EditDishInput extends PickType(PartialType(Dish), [
  'name',
  'options',
  'price',
  'description',
]) {
  @Field((type) => Int)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends BaseOutput {}
