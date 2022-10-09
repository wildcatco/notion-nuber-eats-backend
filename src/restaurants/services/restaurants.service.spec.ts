import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockRepository } from 'src/test-common/helpers';
import { MockRepository } from 'src/test-common/types';
import { User } from 'src/users/entities/user.entity';
import { ILike } from 'typeorm';
import { EditRestaurantInput } from './../dtos/restaurants/edit-restaurant.dto';
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
    const editRestaurantInput: EditRestaurantInput = {
      restaurantId: faker.datatype.number(),
      address: faker.address.streetAddress(),
      categoryName: 'korean bbq chicken',
      coverImg: 'http://sample-image.jpg',
      name: 'BBQ',
    };

    it('should edit restaurant', async () => {
      const foundRestaurant = {
        ownerId: owner.id,
      };
      const mockedCategory = 'category';
      const createdRestaurant = {
        id: editRestaurantInput.restaurantId,
        name: editRestaurantInput.name,
        coverImg: editRestaurantInput.coverImg,
        address: editRestaurantInput.address,
        category: mockedCategory,
      };
      restaurantsRepository.findOneBy.mockResolvedValue(foundRestaurant);
      categoriesRepository.getOrCreate.mockResolvedValue(mockedCategory);
      restaurantsRepository.create.mockReturnValue(createdRestaurant);

      const result = await restaurantsService.editRestaurant(
        owner,
        editRestaurantInput,
      );

      expect(categoriesRepository.getOrCreate).toBeCalledWith(
        editRestaurantInput.categoryName,
      );
      expect(restaurantsRepository.create).toBeCalledWith(createdRestaurant);
      expect(restaurantsRepository.save).toBeCalledWith(createdRestaurant);
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail if restaurant not found with given id', async () => {
      restaurantsRepository.findOneBy.mockResolvedValue(null);

      const result = await restaurantsService.editRestaurant(
        owner,
        editRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found with given id',
      });
    });

    it('should fail if not owner', async () => {
      const foundRestaurant = {
        ownerId: owner.id + 1,
      };
      restaurantsRepository.findOneBy.mockResolvedValue(foundRestaurant);

      const result = await restaurantsService.editRestaurant(
        owner,
        editRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Only owner can edit restaurant',
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findOneBy.mockRejectedValue(new Error());

      const result = await restaurantsService.editRestaurant(
        owner,
        editRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to edit restaurant',
      });
    });
  });

  describe('deleteRestaurant', () => {
    const deleteRestaurantInput = {
      restaurantId: faker.datatype.number(),
    };
    it('should delete restaurant', async () => {
      const foundRestaurant = {
        ownerId: owner.id,
      };
      restaurantsRepository.findOneBy.mockResolvedValue(foundRestaurant);

      const result = await restaurantsService.deleteRestaurant(
        owner,
        deleteRestaurantInput,
      );

      expect(restaurantsRepository.delete).toBeCalledWith(
        deleteRestaurantInput.restaurantId,
      );
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should fail if restaurant not found with given id', async () => {
      restaurantsRepository.findOneBy.mockResolvedValue(null);

      const result = await restaurantsService.deleteRestaurant(
        owner,
        deleteRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found with given id',
      });
    });

    it('should fail if not owner', async () => {
      const foundRestaurant = {
        ownerId: owner.id + 1,
      };
      restaurantsRepository.findOneBy.mockResolvedValue(foundRestaurant);

      const result = await restaurantsService.deleteRestaurant(
        owner,
        deleteRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Only owner can delete restaurant',
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findOneBy.mockRejectedValue(new Error());

      const result = await restaurantsService.deleteRestaurant(
        owner,
        deleteRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to delete restaurant',
      });
    });
  });

  describe('allRestaurants', () => {
    const allRestaurantsInput = {
      page: 1,
      offset: 2,
    };

    it('should return restaurants according to given page and offset', async () => {
      const foundRestaurants = ['res1', 'res2'];
      const totalResults = 20;
      restaurantsRepository.findAndCount.mockResolvedValue([
        foundRestaurants,
        totalResults,
      ]);

      const result = await restaurantsService.allRestaurants(
        allRestaurantsInput,
      );

      expect(restaurantsRepository.findAndCount).toBeCalledWith({
        take: allRestaurantsInput.offset,
        skip: (allRestaurantsInput.page - 1) * allRestaurantsInput.offset,
      });
      expect(result).toEqual({
        ok: true,
        totalPages: Math.ceil(totalResults / allRestaurantsInput.offset),
        totalResults,
        results: foundRestaurants,
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findAndCount.mockRejectedValue(new Error());

      const result = await restaurantsService.allRestaurants(
        allRestaurantsInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to load restaurants',
      });
    });
  });

  describe('findRestaurantById', () => {
    const findRestaurantByIdInput = {
      restaurantId: faker.datatype.number(),
    };

    it('should find restaurant with given id', async () => {
      const foundRestaurant = 'restaurant';
      restaurantsRepository.findOne.mockResolvedValue(foundRestaurant);

      const result = await restaurantsService.findRestaurantById(
        findRestaurantByIdInput,
      );

      expect(restaurantsRepository.findOne).toBeCalledWith({
        where: { id: findRestaurantByIdInput.restaurantId },
        relations: ['menu'],
      });
      expect(result).toEqual({
        ok: true,
        restaurant: foundRestaurant,
      });
    });

    it('should fail if restaurant not found with given id', async () => {
      restaurantsRepository.findOne.mockResolvedValue(null);

      const result = await restaurantsService.findRestaurantById(
        findRestaurantByIdInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found with given id',
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findOne.mockRejectedValue(new Error());

      const result = await restaurantsService.findRestaurantById(
        findRestaurantByIdInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to find restaurant',
      });
    });
  });

  describe('searchRestaurantByName', () => {
    const searchRestaurantByNameInput = {
      query: 'bbq',
      page: 1,
      offset: 5,
    };

    it('should search restaurants with given name', async () => {
      const foundRestaurant = ['res1', 'res2'];
      const totalResults = 20;
      restaurantsRepository.findAndCount.mockResolvedValue([
        foundRestaurant,
        totalResults,
      ]);

      const result = await restaurantsService.searchRestaurantByName(
        searchRestaurantByNameInput,
      );

      expect(restaurantsRepository.findAndCount).toBeCalledWith({
        where: {
          name: ILike(`%${searchRestaurantByNameInput.query}%`),
        },
        take: searchRestaurantByNameInput.offset,
        skip:
          (searchRestaurantByNameInput.page - 1) *
          searchRestaurantByNameInput.offset,
      });
      expect(result).toEqual({
        ok: true,
        totalResults,
        totalPages: Math.ceil(
          totalResults / searchRestaurantByNameInput.offset,
        ),
        restaurants: foundRestaurant,
      });
    });

    it('should fail on exception', async () => {
      restaurantsRepository.findAndCount.mockRejectedValue(new Error());

      const result = await restaurantsService.searchRestaurantByName(
        searchRestaurantByNameInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to search for restaurants',
      });
    });
  });
});
