import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
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
    return {
      ok: true,
    };
  }

  @CatchError('Failed to edit restaurant')
  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: editRestaurantInput.restaurantId },
    });
    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: "You can't edit restaurant that you don't own",
      };
    }
    let category: Category = null;
    if (editRestaurantInput.categoryName) {
      category = await this.categoriesRepository.getOrCreate(
        editRestaurantInput.categoryName,
      );
    }
    await this.restaurantsRepository.save([
      {
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
        ...(category && { category }),
      },
    ]);
    return {
      ok: true,
    };
  }

  @CatchError('Failed to delete restaurant')
  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: "You can't delete restaurant that you don't own",
      };
    }
    await this.restaurantsRepository.delete(restaurantId);
    return {
      ok: true,
    };
  }

  @CatchError('Failed to load categories')
  async allCategories(): Promise<AllCategoriesOutput> {
    const categories = await this.categoriesRepository.find();
    return {
      ok: true,
      categories,
    };
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
      return {
        ok: false,
        error: 'Category not found',
      };
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
    return {
      ok: true,
      totalPages: Math.ceil(totalResults / 25),
      category,
      restaurants,
    };
  }

  @CatchError('Failed to load restaurants')
  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    const [restaurants, totalResults] =
      await this.restaurantsRepository.findAndCount({
        take: 25,
        skip: (page - 1) * 25,
      });
    return {
      ok: true,
      totalPages: Math.ceil(totalResults / 25),
      totalResults,
      results: restaurants,
    };
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
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    return {
      ok: true,
      restaurant,
    };
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
    return {
      ok: true,
      restaurants,
      totalResults,
      totalPages: Math.ceil(totalResults / 25),
    };
  }

  @CatchError('Failed to create dish')
  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: createDishInput.restaurantId },
    });
    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: 'Only owner of the restaurant can add menu',
      };
    }
    await this.dishesRepository.save({
      ...createDishInput,
      restaurant,
    });
    return {
      ok: true,
    };
  }

  async checkDish(dishId: number, ownerId: number, toDo: 'edit' | 'delete') {
    const dish = await this.dishesRepository.findOne({
      where: { id: dishId },
      relations: ['restaurant'],
    });
    if (!dish) {
      return {
        ok: false,
        error: 'Dish not found',
      };
    }
    if (ownerId !== dish.restaurant.ownerId) {
      return {
        ok: false,
        error: `Only owner can ${toDo} dish`,
      };
    }
  }

  @CatchError('Failed to edit dish')
  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    const error = await this.checkDish(editDishInput.dishId, owner.id, 'edit');
    if (error) {
      return error;
    }
    await this.dishesRepository.save([
      {
        id: editDishInput.dishId,
        ...editDishInput,
      },
    ]);
    return {
      ok: true,
    };
  }

  @CatchError('Failed to delete dish')
  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    const error = await this.checkDish(dishId, owner.id, 'delete');
    if (error) {
      return error;
    }
    await this.dishesRepository.delete(dishId);
    return {
      ok: true,
    };
  }
}
