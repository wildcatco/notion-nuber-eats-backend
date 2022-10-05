import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
import { errorResponse, successResponse } from 'src/common/common.helpers';
import { User } from 'src/users/entities/user.entity';
import { ILike, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from '../dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from '../dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from '../dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from '../dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from '../dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from '../dtos/search-restaurant.dto';
import { Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    private readonly categoriesRepository: CategoryRepository,
  ) {}

  @CatchError('Failed to create restaurant')
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    const newRestaurant = this.restaurantsRepository.create(
      createRestaurantInput,
    );
    newRestaurant.owner = owner;
    const category = await this.categoriesRepository.getOrCreate(
      createRestaurantInput.categoryName,
    );
    newRestaurant.category = category;
    await this.restaurantsRepository.save(newRestaurant);
    return successResponse();
  }

  @CatchError('Failed to edit restaurant')
  async editRestaurant(
    owner: User,
    {
      restaurantId,
      address,
      categoryName,
      coverImg,
      name,
    }: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    const restaurant = await this.restaurantsRepository.findOneBy({
      id: restaurantId,
    });
    if (!restaurant) {
      return errorResponse('Restaurant not found with given id');
    }
    if (owner.id !== restaurant.ownerId) {
      return errorResponse('Only owner can edit restaurant');
    }
    let category: Category = null;
    if (categoryName) {
      category = await this.categoriesRepository.getOrCreate(categoryName);
    }
    await this.restaurantsRepository.save(
      this.restaurantsRepository.create({
        id: restaurantId,
        name,
        coverImg,
        address,
        category,
      }),
    );
    return successResponse();
  }

  @CatchError('Failed to delete restaurant')
  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    const restaurant = await this.restaurantsRepository.findOneBy({
      id: restaurantId,
    });
    if (!restaurant) {
      return errorResponse('Restaurant not found with given id');
    }
    if (owner.id !== restaurant.ownerId) {
      return errorResponse('Only owner can delete restaurant');
    }
    await this.restaurantsRepository.delete(restaurantId);
    return successResponse();
  }

  @CatchError('Failed to load restaurants')
  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    const [restaurants, totalResults] =
      await this.restaurantsRepository.findAndCount({
        take: 25,
        skip: (page - 1) * 25,
      });
    return successResponse<RestaurantsOutput>({
      totalPages: Math.ceil(totalResults / 25),
      totalResults,
      results: restaurants,
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

  @CatchError('Failed to search for restaurants')
  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    const [restaurants, totalResults] =
      await this.restaurantsRepository.findAndCount({
        where: {
          name: ILike(`%${query}%`),
          // name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        take: 25,
        skip: (page - 1) * 25,
      });
    return successResponse<SearchRestaurantOutput>({
      restaurants,
      totalResults,
      totalPages: Math.ceil(totalResults / 25),
    });
  }
}
