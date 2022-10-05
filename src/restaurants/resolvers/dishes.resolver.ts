import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { User } from 'src/users/entities/user.entity';
import {
  CreateDishInput,
  CreateDishOutput,
} from '../dtos/dishes/create-dish.dto';
import {
  DeleteDishInput,
  DeleteDishOutput,
} from '../dtos/dishes/delete-dish.dto';
import { EditDishInput, EditDishOutput } from '../dtos/dishes/edit-dish.dto';
import { Dish } from '../entities/dish.entity';
import { DishesService } from '../services/dishes.service';

@Resolver((of) => Dish)
export class DishesResolver {
  constructor(private readonly dishesService: DishesService) {}

  @Mutation((returns) => CreateDishOutput)
  @Roles('Owner')
  createDish(
    @AuthUser() authUser: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.dishesService.createDish(authUser, createDishInput);
  }

  @Mutation((returns) => EditDishOutput)
  @Roles('Owner')
  editDish(
    @AuthUser() authUser: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.dishesService.editDish(authUser, editDishInput);
  }

  @Mutation((returns) => DeleteDishOutput)
  @Roles('Owner')
  deleteDish(
    @AuthUser() authUser: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<EditDishOutput> {
    return this.dishesService.deleteDish(authUser, deleteDishInput);
  }
}
