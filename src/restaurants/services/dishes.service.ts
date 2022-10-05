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
