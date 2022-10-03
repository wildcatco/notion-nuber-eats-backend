import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import {
  CategoriesResolver,
  DishResolver,
  RestaurantsResolver,
} from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Dish])],
  providers: [
    RestaurantsResolver,
    CategoriesResolver,
    DishResolver,
    RestaurantsService,
    CategoryRepository,
  ],
})
export class RestaurantsModule {}
