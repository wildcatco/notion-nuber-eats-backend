import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
import { errorResponse, successResponse } from 'src/common/common.helpers';
import { User } from 'src/users/entities/user.entity';
import { ILike, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from '../dtos/restaurants/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from '../dtos/restaurants/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from '../dtos/restaurants/edit-restaurant.dto';
import {
  RestaurantInput,
  RestaurantOutput,
} from '../dtos/restaurants/restaurant.dto';
import {
  RestaurantsInput,
  RestaurantsOutput,
} from '../dtos/restaurants/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from '../dtos/restaurants/search-restaurant.dto';
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

  async checkOwner(
    restaurantId: number,
    ownerId: number,
    toDo: 'edit' | 'delete',
  ) {
    const restaurant = await this.restaurantsRepository.findOneBy({
      id: restaurantId,
    });

    if (!restaurant) {
      return 'Restaurant not found with given id';
    }

    if (ownerId !== restaurant.ownerId) {
      return `Only owner can ${toDo} restaurant`;
    }
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
    const error = await this.checkOwner(restaurantId, owner.id, 'edit');
    if (error) {
      return errorResponse(error);
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
    const error = await this.checkOwner(restaurantId, owner.id, 'delete');
    if (error) {
      return errorResponse(error);
    }

    await this.restaurantsRepository.delete(restaurantId);
    return successResponse();
  }

  @CatchError('Failed to load restaurants')
  async allRestaurants({
    page,
    offset,
  }: RestaurantsInput): Promise<RestaurantsOutput> {
    const [restaurants, totalResults] =
      await this.restaurantsRepository.findAndCount({
        take: offset,
        skip: (page - 1) * offset,
      });

    return successResponse<RestaurantsOutput>({
      totalPages: Math.ceil(totalResults / offset),
      totalResults,
      results: restaurants,
    });
  }

  @CatchError('Failed to find restaurant')
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
    offset,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    const [restaurants, totalResults] =
      await this.restaurantsRepository.findAndCount({
        where: {
          name: ILike(`%${query}%`),
        },
        take: offset,
        skip: (page - 1) * offset,
      });

    return successResponse<SearchRestaurantOutput>({
      restaurants,
      totalResults,
      totalPages: Math.ceil(totalResults / offset),
    });
  }
}
