import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from 'src/test-common/helpers';
import { MockRepository } from 'src/test-common/types';
import { User } from 'src/users/entities/user.entity';
import { Category } from './../entities/category.entity';
import { Restaurant } from './../entities/restaurant.entity';
import { CategoryRepository } from './../repositories/category.repository';
import { RestaurantsService } from './restaurants.service';

const mockCategoryRepository = {
  getOrCreate: jest.fn(),
};

describe('UsersService', () => {
  let restaurantsService: RestaurantsService;
  let restaurantsRepository: MockRepository<Restaurant>;
  let categoriesRepository: MockRepository<Category> & {
    getOrCreate: jest.Mock;
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository(),
        },
        {
          provide: CategoryRepository,
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    restaurantsService = module.get(RestaurantsService);
    restaurantsRepository = module.get(getRepositoryToken(Restaurant));
    categoriesRepository = module.get(CategoryRepository);
  });

  it('should be defined', () => {
    expect(restaurantsService).toBeDefined();
  });

  const owner = {
    id: faker.datatype.number(),
  } as User;

  describe('createRestaurant', () => {
    const createRestaurantInput = {
      name: 'BBQ',
      coverImg: 'http://sample-image.jpg',
      address: faker.address.streetAddress(),
      categoryName: 'korean bbq chicken',
    };

    it('should create restaurant', async () => {
      const createdRestaurant = {
        owner: null,
        category: null,
      };
      const mockedCategory = 'test';
      restaurantsRepository.create.mockReturnValue(createdRestaurant);
      categoriesRepository.getOrCreate.mockResolvedValue(mockedCategory);

      const result = await restaurantsService.createRestaurant(
        owner,
        createRestaurantInput,
      );

      expect(restaurantsRepository.create).toBeCalledWith(
        createRestaurantInput,
      );
      expect(categoriesRepository.getOrCreate).toBeCalledWith(
        createRestaurantInput.categoryName,
      );
      expect(restaurantsRepository.save).toBeCalledWith({
        owner,
        category: mockedCategory,
      });
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail on exception', async () => {
      categoriesRepository.getOrCreate.mockRejectedValue(new Error());

      const result = await restaurantsService.createRestaurant(
        owner,
        createRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to create restaurant',
      });
    });
  });

  describe('editRestaurant', () => {
    it.todo('should edit restaurant');
    it.todo('should fail if restaurant not found with given id');
    it.todo('should fail if not owner');
    it.todo('should fail on exception');
  });

  describe('deleteRestaurant', () => {
    it.todo('should delete restaurant');
    it.todo('should fail if restaurant not found with given id');
    it.todo('should fail if not owner');
    it.todo('should fail on exception');
  });

  describe('allRestaurants', () => {
    it.todo('should return restaurants according to given page and offset');
    it.todo('should fail on exception');
  });

  describe('findRestaurantById', () => {
    it.todo('should find restaurant with given id');
    it.todo('should fail if restaurant not found with given id');
    it.todo('should fail on exception');
  });

  describe('searchRestaurantByName', () => {
    it.todo('should search restaurants with given name');
    it.todo('should fail on exception');
  });
});
