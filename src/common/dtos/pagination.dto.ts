import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from './core-output.dto';

@InputType()
export class PaginationInput {
  @Field((type) => Int, { defaultValue: 1 })
  @IsNumber()
  page: number;

  @Field((type) => Int, { defaultValue: 25 })
  @IsNumber()
  offset: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field((type) => Int, { nullable: true })
  totalPages?: number;

  @Field((type) => Int, { nullable: true })
  totalResults?: number;
}
