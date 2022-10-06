import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/core-output.dto';

@InputType()
export class DeleteRestaurantInput {
  @Field((type) => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}
