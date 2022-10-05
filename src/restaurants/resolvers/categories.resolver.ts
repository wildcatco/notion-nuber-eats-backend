import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AllCategoriesOutput } from '../dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';
import { CategoriesService } from '../services/categories.service';

@Resolver((of) => Category)
export class CategoriesResolver {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ResolveField((type) => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.categoriesService.countRestaurantsWithCategory(category);
  }

  @Query((type) => AllCategoriesOutput)
  async allCategories(): Promise<AllCategoriesOutput> {
    return this.categoriesService.allCategories();
  }

  @Query((type) => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.categoriesService.findCategoryBySlug(categoryInput);
  }
}
