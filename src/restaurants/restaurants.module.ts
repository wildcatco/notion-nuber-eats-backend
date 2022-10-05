import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';
import { CategoriesResolver } from './resolvers/categories.resolver';
import { DishesResolver } from './resolvers/dishes.resolver';
import { RestaurantsResolver } from './resolvers/restaurants.resolver';
import { CategoriesService } from './services/categories.service';
import { DishesService } from './services/dishes.service';
import { RestaurantsService } from './services/restaurants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Dish])],
  providers: [
    RestaurantsResolver,
    CategoriesResolver,
    DishesResolver,
    RestaurantsService,
    CategoriesService,
    DishesService,
    CategoryRepository,
  ],
})
export class RestaurantsModule {}
