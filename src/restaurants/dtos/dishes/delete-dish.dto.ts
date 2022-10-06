import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/core-output.dto';

@InputType()
export class DeleteDishInput {
  @Field((type) => Int)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
