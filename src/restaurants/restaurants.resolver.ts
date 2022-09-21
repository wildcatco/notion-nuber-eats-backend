import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class RestaurantsResolver {
  // @Query(()) => Boolean)
  // 관습적으로 아래와 같은 표현 많이 사용
  @Query((returns) => Boolean)
  isPizzaGood(): boolean {
    return true;
  }
}
