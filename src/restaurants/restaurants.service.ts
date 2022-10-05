import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
import { errorResponse, successResponse } from 'src/common/common.helpers';
import { User } from 'src/users/entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    private readonly categoriesRepository: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishesRepository: Repository<Dish>,
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

  @CatchError('Failed to load categories')
  async allCategories(): Promise<AllCategoriesOutput> {
    const categories = await this.categoriesRepository.find();
    return successResponse<AllCategoriesOutput>({ categories });
  }

  countRestaurants(category: Category): Promise<number> {
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
    const totalResults = await this.countRestaurants(category);
    return successResponse<CategoryOutput>({
      totalPages: Math.ceil(totalResults / 25),
      category,
      restaurants,
    });
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

  @CatchError('Failed to create dish')
  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    const restaurant = await this.restaurantsRepository.findOneBy({
      id: createDishInput.restaurantId,
    });
    if (!restaurant) {
      return errorResponse('Restaurant not found with given id');
    }
    if (owner.id !== restaurant.ownerId) {
      return errorResponse('Only owner can add menu');
    }
    await this.dishesRepository.save(
      this.dishesRepository.create({
        ...createDishInput,
        restaurant,
      }),
    );
    return successResponse();
  }

  async checkDish(dishId: number, ownerId: number, toDo: 'edit' | 'delete') {
    const error = { notFound: false, notOwner: false };
    const dish = await this.dishesRepository.findOne({
      where: { id: dishId },
      relations: ['restaurant'],
    });
    if (!dish) {
      error.notFound = true;
      return error;
      // return errorResponse('Dish not found with given id');
    }
    if (ownerId !== dish.restaurant.ownerId) {
      error.notOwner = true;
      // return errorResponse(`Only owner can ${toDo} dish`);
    }
  }

  @CatchError('Failed to edit dish')
  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    const error = await this.checkDish(editDishInput.dishId, owner.id, 'edit');
    if (error.notFound) {
      return errorResponse('Dish not found with given id');
    }
    if (error.notOwner) {
      return errorResponse('Only owner can edit dish');
    }

    await this.dishesRepository.save(
      this.dishesRepository.create({
        id: editDishInput.dishId,
        ...editDishInput,
      }),
    );
    return successResponse();
  }

  @CatchError('Failed to delete dish')
  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    const error = await this.checkDish(dishId, owner.id, 'delete');
    if (error.notFound) {
      return errorResponse('Dish not found with given id');
    }
    if (error.notOwner) {
      return errorResponse('Only owner can delete dish');
    }

    await this.dishesRepository.delete(dishId);
    return successResponse();
  }
}
