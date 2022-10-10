import {
  createDish,
  createRestaurant,
  createUsers,
  loadJSON,
  login,
} from './utils';

async function main() {
  // 유저 데이터 생성
  const users = await loadJSON('./data/users.json');
  await createUsers(users);

  // 음식점 데이터 생성
  const restaurants = await loadJSON('./data/restaurants.json');
  for (const restaurant of restaurants) {
    const token = await login(restaurant.owner, 'testPassword');
    await createRestaurant(restaurant, token);
  }

  // 음식 데이터 생성
  const dishes = await loadJSON('./data/dishes.json');
  for (const dish of dishes) {
    const token = await login(dish.owner, 'testPassword');
    await createDish(dish, token);
  }
}

main();
