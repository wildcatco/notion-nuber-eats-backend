export interface CreateUserInput {
  email: string;
  password: string;
  role: string;
}

export interface CreateRestaurantsInput {
  name: string;
  address: string;
  coverImg: string;
  categoryName: string;
}

export interface CreateDishInput {
  restaurantId: number;
  name: string;
  price: number;
  description: string;
  options?: Record<string, any>[];
}
