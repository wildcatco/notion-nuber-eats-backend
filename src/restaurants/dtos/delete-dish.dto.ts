import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { BaseOutput } from 'src/common/dtos/base-output.dto';

@InputType()
export class DeleteDishInput {
  @Field((type) => Int)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends BaseOutput {}
