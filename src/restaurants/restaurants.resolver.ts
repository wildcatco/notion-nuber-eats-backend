import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
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
import { RestaurantsService } from './restaurants.service';

@Resolver((of) => Restaurant)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Mutation((returns) => CreateRestaurantOutput)
  @Roles('Owner')
  createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantsService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation((returns) => EditRestaurantOutput)
  @Roles('Owner')
  editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantsService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation((returns) => DeleteRestaurantOutput)
  @Roles('Owner')
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantsService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }

  @Query((returns) => RestaurantsOutput)
  restaurants(
    @Args('input') restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantsService.allRestaurants(restaurantsInput);
  }

  @Query((returns) => RestaurantOutput)
  restaurant(
    @Args('input') restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantsService.findRestaurantById(restaurantInput);
  }

  @Query((returns) => SearchRestaurantOutput)
  searchRestaurant(
    @Args('input') searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantsService.searchRestaurantByName(
      searchRestaurantInput,
    );
  }
}

@Resolver((of) => Category)
export class CategoriesResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ResolveField((type) => Int)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantsService.countRestaurants(category);
  }

  @Query((type) => AllCategoriesOutput)
  async allCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantsService.allCategories();
  }

  @Query((type) => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantsService.findCategoryBySlug(categoryInput);
  }
}

@Resolver((of) => Dish)
export class DishResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Mutation((returns) => CreateDishOutput)
  @Roles('Owner')
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantsService.createDish(owner, createDishInput);
  }

  @Mutation((returns) => EditDishOutput)
  @Roles('Owner')
  editDish(
    @AuthUser() owner: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantsService.editDish(owner, editDishInput);
  }

  @Mutation((returns) => DeleteDishOutput)
  @Roles('Owner')
  deleteDish(
    @AuthUser() owner: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantsService.deleteDish(owner, deleteDishInput);
  }
}
