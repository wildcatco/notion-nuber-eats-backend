import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Dish } from '../entities/dish.entity';
import { Restaurant } from '../entities/restaurant.entity';
import { DishesService } from './dishes.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

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
    id: 1,
  } as User;

  describe('createDish', () => {
    const createDishInput = {
      restaurantId: 10,
      name: 'golden olive chicken',
      description: 'delicious chicken',
      price: 10.5,
      options: [],
    };

    it('should create dish', async () => {
      const mockedRestaurant = { ownerId: owner.id };
      const mockedDish = 'dish';

      restaurantsRepository.findOneBy.mockResolvedValue(mockedRestaurant);
      dishesRepository.create.mockReturnValue(mockedDish);

      const result = await dishesService.createDish(owner, createDishInput);

      expect(dishesRepository.create).toBeCalledWith({
        name: createDishInput.name,
        description: createDishInput.description,
        price: createDishInput.price,
        options: createDishInput.options,
        restaurant: mockedRestaurant,
      });
      expect(dishesRepository.save).toBeCalledWith(mockedDish);

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
      const mockedRestaurant = { ownerId: 999 };

      restaurantsRepository.findOneBy.mockResolvedValue(mockedRestaurant);

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
      dishId: 10,
      name: 'new-dish-name',
      description: 'des',
      price: 1.1,
      options: [],
    };

    it('should edit dish', async () => {
      const mockedDish = {
        restaurant: {
          ownerId: owner.id,
        },
      };

      dishesRepository.findOne.mockResolvedValue(mockedDish);
      dishesRepository.create.mockReturnValue(mockedDish);

      const result = await dishesService.editDish(owner, editDishInput);

      expect(dishesRepository.create).toBeCalledWith({
        id: editDishInput.dishId,
        name: editDishInput.name,
        description: editDishInput.description,
        price: editDishInput.price,
        options: editDishInput.options,
      });
      expect(dishesRepository.save).toBeCalledWith(mockedDish);

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
      const mockedDish = {
        restaurant: {
          ownerId: 999,
        },
      };

      dishesRepository.findOne.mockResolvedValue(mockedDish);

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
      dishId: 10,
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
      const mockedDish = {
        restaurant: {
          ownerId: 999,
        },
      };

      dishesRepository.findOne.mockResolvedValue(mockedDish);

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
