import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';

@InputType()
export class DeleteRestaurantInput {
  @Field((type) => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class DeleteRestaurantOutput extends BaseOutput {}
