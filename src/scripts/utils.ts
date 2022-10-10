import * as fs from 'fs/promises';
import got from 'got';
import { CreateDishInput } from 'src/restaurants/dtos/dishes/create-dish.dto';
import { CreateRestaurantsInput, CreateUserInput } from './interfaces';
import path = require('path');

export async function loadJSON(pathname: string) {
  const data = await fs.readFile(path.resolve(__dirname, pathname));
  return JSON.parse(data.toString());
}

export async function login(email: string, password: string) {
  const result = await got.post('http://localhost:3000/graphql', {
    json: {
      query: `
      mutation {
        login (input: {
          email: "${email}",
          password:"${password}"
        }) {
          ok
          error
          token
        }
      }
      `,
    },
  });
  const { token } = JSON.parse(result.body)['data']['login'];
  return token;
}

export async function createUsers(users: CreateUserInput[]) {
  for (const user of users) {
    await got.post('http://localhost:3000/graphql', {
      json: {
        query: `
        mutation {
          createAccount(input: {
            email:"${user.email}",
            password: "${user.password}",
            role: ${user.role}
          }) {
            ok
            error
          }
        }
        `,
      },
    });
  }
}

export async function createRestaurant(
  restaurant: CreateRestaurantsInput,
  token: string,
) {
  await got.post('http://localhost:3000/graphql', {
    headers: { 'X-JWT': token },
    json: {
      query: `
        mutation {
          createRestaurant(input: {
            name: "${restaurant.name}",
            address: "${restaurant.address}",
            coverImg: "${restaurant.coverImg}",
            categoryName: "${restaurant.categoryName}"
          }) {
            ok
            error
          }
        }
        `,
    },
  });
}

export async function createDish(dish: CreateDishInput, token: string) {
  const options = dish.options ? JSON.stringify(dish.options) : '[]';

  const query = `
  mutation {
    createDish(input: {
      restaurantId: ${dish.restaurantId}
      name: "${dish.name}"
      price: ${dish.price}
      description: "${dish.description}"
      options: []
    }) {
      ok
      error
    }
  }
  `;

  const result = await got.post('http://localhost:3000/graphql', {
    headers: { 'X-JWT': token },
    json: {
      query: query,
    },
  });
}
