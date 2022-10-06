import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from 'src/restaurants/entities/category.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Repository } from 'typeorm';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoriesService } from './categories.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('CategoriesService', () => {
  let categoriesService: CategoriesService;
  let categoriesRepository: MockRepository<Category>;
  let restaurantsRepository: MockRepository<Restaurant>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoryRepository,
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    categoriesService = module.get<CategoriesService>(CategoriesService);
    categoriesRepository = module.get(CategoryRepository);
    restaurantsRepository = module.get<MockRepository<Restaurant>>(
      getRepositoryToken(Restaurant),
    );
  });

  it('should be defined', () => {
    expect(categoriesService).toBeDefined();
  });

  describe('allCategories', () => {
    it('should return all categories', async () => {
      categoriesRepository.find.mockResolvedValue(['category1', 'category2']);

      const result = await categoriesService.allCategories();

      expect(result).toEqual({
        ok: true,
        categories: ['category1', 'category2'],
      });
    });

    it('should fail on exception', async () => {
      categoriesRepository.find.mockRejectedValue(new Error());

      const result = await categoriesService.allCategories();

      expect(result).toEqual({
        ok: false,
        error: 'Failed to load categories',
      });
    });
  });

  describe('countRestaurantWithCategory', () => {
    const category = {
      id: 10,
    } as Category;

    it('should count restaurants with category', async () => {
      await categoriesService.countRestaurantsWithCategory(category);

      expect(restaurantsRepository.count).toBeCalledWith({
        where: { category: { id: category.id } },
      });
    });
  });

  describe('findCategoryBySlug', () => {
    const findCategoryBySlugInput = {
      slug: 'bbq-chicken',
      page: 2,
      offset: 2,
    };

    it('should find category with slug', async () => {
      const mockedCategory = {
        restaurants: ['res1', 'res2', 'res3', 'res4', 'res5'],
      };

      categoriesRepository.findOne.mockResolvedValue(mockedCategory);

      const result = await categoriesService.findCategoryBySlug(
        findCategoryBySlugInput,
      );

      expect(result).toEqual({
        ok: true,
        totalResults: 5,
        totalPages: 3,
        category: mockedCategory,
        restaurants: ['res3', 'res4'],
      });
    });

    it('should not find category with non-existing slug', async () => {
      categoriesRepository.findOne.mockResolvedValue(null);

      const result = await categoriesService.findCategoryBySlug(
        findCategoryBySlugInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Category not found with given slug',
      });
    });

    it('should fail on exception', async () => {
      categoriesRepository.findOne.mockRejectedValue(new Error());

      const result = await categoriesService.findCategoryBySlug(
        findCategoryBySlugInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Failed to find category',
      });
    });
  });
});
