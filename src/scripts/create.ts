import * as fs from 'fs/promises';
import got from 'got';
import path = require('path');

interface CreateUserInput {
  email: string;
  password: string;
  role: string;
}

interface CreateRestaurantsInput {
  name: string;
  address: string;
  coverImg: string;
  categoryName: string;
}

async function loadJSON(pathname: string) {
  const data = await fs.readFile(path.resolve(__dirname, pathname));
  return JSON.parse(data.toString());
}

async function login(email: string, password: string) {
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

  const { token } = result.body['data']['login'];
  return token;
}

async function createUsers(users: CreateUserInput[]) {
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

async function createRestaurants(restaurants: CreateRestaurantsInput[]) {
  for (const restaurant of restaurants) {
    const result = await got.post('http://localhost:3000/graphql', {
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
    console.log(result.body);
  }
}

async function main() {
  const users = await loadJSON('./data/users.json');
  await createUsers(users);

  const restaurants = await loadJSON('./data/restaurants.json');
  const token = await login('owner1', '');
  await createRestaurants(restaurants);
}

main();
