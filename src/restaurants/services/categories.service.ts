import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
import { errorResponse, successResponse } from 'src/common/common.helpers';
import { Repository } from 'typeorm';
import { AllCategoriesOutput } from '../dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from '../dtos/category.dto';
import { RestaurantInput, RestaurantOutput } from '../dtos/restaurant.dto';
import { Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    private readonly categoriesRepository: CategoryRepository,
  ) {}

  @CatchError('Failed to load categories')
  async allCategories(): Promise<AllCategoriesOutput> {
    const categories = await this.categoriesRepository.find();
    return successResponse<AllCategoriesOutput>({ categories });
  }

  countRestaurantsWithCategory(category: Category): Promise<number> {
    return this.restaurantsRepository.count({
      where: { category: { id: category.id } },
    });
  }

  @CatchError('Failed to load category')
  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
      relations: ['restaurants'],
    });
    if (!category) {
      return errorResponse('Category not found with given slug');
    }
    const restaurants = await this.restaurantsRepository.find({
      where: {
        category: { id: category.id },
      },
      take: 25,
      skip: (page - 1) * 25,
    });
    category.restaurants = restaurants;
    const totalResults = await this.countRestaurantsWithCategory(category);
    return successResponse<CategoryOutput>({
      totalPages: Math.ceil(totalResults / 25),
      category,
      restaurants,
    });
  }

  @CatchError('Failed to load restaurant')
  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: restaurantId },
      relations: ['menu'],
    });
    if (!restaurant) {
      return errorResponse('Restaurant not found with given id');
    }
    return successResponse<RestaurantOutput>({ restaurant });
  }
}
