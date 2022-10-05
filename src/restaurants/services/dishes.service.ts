import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError } from 'src/common/common.decorators';
import { errorResponse, successResponse } from 'src/common/common.helpers';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
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
import { Restaurant } from '../entities/restaurant.entity';

@Injectable()
export class DishesService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishesRepository: Repository<Dish>,
  ) {}

  @CatchError('Failed to create dish')
  async createDish(
    owner: User,
    { restaurantId, name, description, price, options }: CreateDishInput,
  ): Promise<CreateDishOutput> {
    const restaurant = await this.restaurantsRepository.findOneBy({
      id: restaurantId,
    });

    if (!restaurant) {
      return errorResponse('Restaurant not found with given id');
    }

    if (owner.id !== restaurant.ownerId) {
      return errorResponse('Only owner can add menu');
    }

    await this.dishesRepository.save(
      this.dishesRepository.create({
        name,
        description,
        price,
        options,
        restaurant,
      }),
    );
    return successResponse();
  }

  async checkDish(dishId: number, ownerId: number, toDo: 'edit' | 'delete') {
    const dish = await this.dishesRepository.findOne({
      where: { id: dishId },
      relations: ['restaurant'],
    });

    if (!dish) {
      return 'Dish not found with given id';
    }

    if (ownerId !== dish.restaurant.ownerId) {
      return `Only owner can ${toDo} dish`;
    }
  }

  @CatchError('Failed to edit dish')
  async editDish(
    owner: User,
    { dishId, name, description, price, options }: EditDishInput,
  ): Promise<EditDishOutput> {
    const error = await this.checkDish(dishId, owner.id, 'edit');
    if (error) {
      return errorResponse(error);
    }

    await this.dishesRepository.save(
      this.dishesRepository.create({
        id: dishId,
        name,
        description,
        price,
        options,
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
    if (error) {
      return errorResponse(error);
    }

    await this.dishesRepository.delete(dishId);

    return successResponse();
  }
}
