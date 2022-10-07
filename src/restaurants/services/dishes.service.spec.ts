import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from 'src/test-common/helpers';
import { MockRepository } from 'src/test-common/types';
import { User } from 'src/users/entities/user.entity';
import { Dish } from '../entities/dish.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { CreateDishInput } from './../dtos/dishes/create-dish.dto';
import { DishesService } from './dishes.service';

describe('DishesService', () => {
  let dishesService: DishesService;
  let restaurantsRepository: MockRepository<Restaurant>;
  let dishesRepository: MockRepository<Dish>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DishesService,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Dish),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    dishesService = module.get<DishesService>(DishesService);
    restaurantsRepository = module.get<MockRepository<Restaurant>>(
      getRepositoryToken(Restaurant),
    );
    dishesRepository = module.get<MockRepository<Dish>>(
      getRepositoryToken(Dish),
    );
  });

  it('should be defined', () => {
    expect(dishesService).toBeDefined();
  });

  const owner = {
    id: faker.datatype.number(),
  } as User;

  describe('createDish', () => {
    const createDishInput = {
      restaurantId: faker.datatype.number(),
      name: faker.commerce.product(),
      description: faker.lorem.text(),
      price: faker.datatype.float({ min: 1, max: 100 }),
      options: [
        {
          name: 'Spice Level',
          choices: [{ name: 'LittleBit' }, { name: 'Kill Me' }],
        },
      ],
    } as CreateDishInput;

    it('should create dish', async () => {
      const foundRestaurant = { ownerId: owner.id };
      const createdDish = { name: createDishInput.name } as Dish;

      restaurantsRepository.findOneBy.mockResolvedValue(foundRestaurant);
      dishesRepository.create.mockReturnValue(createdDish);

      const result = await dishesService.createDish(owner, createDishInput);

      expect(dishesRepository.create).toBeCalledWith({
        name: createDishInput.name,
        description: createDishInput.description,
        price: createDishInput.price,
        options: createDishInput.options,
        restaurant: foundRestaurant,
      });
      expect(dishesRepository.save).toBeCalledWith(createdDish);

      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail if restaurant not found with given id', async () => {
      restaurantsRepository.findOneBy.mockResolvedValue(null);

      const result = await dishesService.createDish(owner, createDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found with given id',
      });
    });

    it('should fail if not owner', async () => {
      const foundRestaurant = { ownerId: 999 };

      restaurantsRepository.findOneBy.mockResolvedValue(foundRestaurant);

      const result = await dishesService.createDish(owner, createDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Only owner can add menu',
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findOneBy.mockRejectedValue(new Error());

      const result = await dishesService.createDish(owner, createDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Failed to create dish',
      });
    });
  });

  describe('editDish', () => {
    const editDishInput = {
      dishId: faker.datatype.number(),
      name: faker.commerce.product(),
      description: faker.lorem.text(),
      price: faker.datatype.float({ min: 1, max: 100 }),
    };

    it('should edit dish', async () => {
      const foundDish = {
        restaurant: {
          ownerId: owner.id,
        },
      };

      dishesRepository.findOne.mockResolvedValue(foundDish);
      dishesRepository.create.mockReturnValue(foundDish);

      const result = await dishesService.editDish(owner, editDishInput);

      expect(dishesRepository.create).toBeCalledWith({
        id: editDishInput.dishId,
        name: editDishInput.name,
        description: editDishInput.description,
        price: editDishInput.price,
      });
      expect(dishesRepository.save).toBeCalledWith(foundDish);

      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail if dish not found with given id', async () => {
      dishesRepository.findOne.mockResolvedValue(null);

      const result = await dishesService.editDish(owner, editDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Dish not found with given id',
      });
    });

    it('should fail if not owner', async () => {
      const foundDish = {
        restaurant: {
          ownerId: 999,
        },
      };

      dishesRepository.findOne.mockResolvedValue(foundDish);

      const result = await dishesService.editDish(owner, editDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Only owner can edit dish',
      });
    });

    it('should fail on exception', async () => {
      dishesRepository.findOne.mockRejectedValue(new Error());

      const result = await dishesService.editDish(owner, editDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Failed to edit dish',
      });
    });
  });

  describe('deleteDish', () => {
    const deleteDishInput = {
      dishId: faker.datatype.number(),
    };

    it('should delete dish', async () => {
      const mockedDish = {
        restaurant: {
          ownerId: owner.id,
        },
      };

      dishesRepository.findOne.mockResolvedValue(mockedDish);

      const result = await dishesService.deleteDish(owner, deleteDishInput);

      expect(dishesRepository.delete).toBeCalledWith(deleteDishInput.dishId);
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail if dish not found with given id', async () => {
      dishesRepository.findOne.mockResolvedValue(null);

      const result = await dishesService.editDish(owner, deleteDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Dish not found with given id',
      });
    });

    it('should fail if not owner', async () => {
      const foundDish = {
        restaurant: {
          ownerId: 999,
        },
      };

      dishesRepository.findOne.mockResolvedValue(foundDish);

      const result = await dishesService.deleteDish(owner, deleteDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Only owner can delete dish',
      });
    });

    it('should fail on exception', async () => {
      dishesRepository.findOne.mockRejectedValue(new Error());

      const result = await dishesService.deleteDish(owner, deleteDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Failed to delete dish',
      });
    });
  });
});
