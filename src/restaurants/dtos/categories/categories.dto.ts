import { Field, ObjectType } from '@nestjs/graphql';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Category } from '../../entities/category.entity';

@ObjectType()
export class CategoriesOutput extends BaseOutput {
  @Field((type) => [Category], { nullable: true })
  categories?: Category[];
}
