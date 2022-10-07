import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GRAPHQL_ENDPOINT } from 'src/test-common/constants';
import { User } from 'src/users/entities/user.entity';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { Verification } from './../src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const TEST_USER = {
  email: faker.internet.email(),
  password: faker.internet.password(),
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwtToken: string;

  const baseRequest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicRequest = (query: string) => baseRequest().send({ query });
  const privateRequest = (query: string, token: string) =>
    baseRequest().set('X-JWT', token).send({ query });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));

    await app.init();
  });

  afterAll(async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const connection = await dataSource.initialize();
    await connection.dropDatabase();
    await connection.destroy();

    app.close();
  });

  describe('createAccount', () => {
    const createAccountQuery = `
    mutation {
      createAccount(input: {
        email:"${TEST_USER.email}",
        password: "${TEST_USER.password}",
        role: Owner
      }) {
        ok
        error
      }
    }
    `;

    it('should create account', () => {
      return publicRequest(createAccountQuery)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;

          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });

    it('should fail if account already exists', () => {
      return publicRequest(createAccountQuery)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(false);
          expect(error).toBe('Email is already in use');
        });
    });
  });

  const loginQuery = (email: string, password: string): string => `
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
    `;

  describe('login', () => {
    it('should login with correct email and password', () => {
      return publicRequest(loginQuery(TEST_USER.email, TEST_USER.password))
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;

          expect(ok).toBe(true);
          expect(error).toBeNull();
          expect(token).toEqual(expect.any(String));

          jwtToken = token;
        });
    });

    it('should fail to login if email is wrong', () => {
      return publicRequest(loginQuery('wrong@mail.com', TEST_USER.password))
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;

          expect(ok).toBe(false);
          expect(error).toBe('User not found with given email');
          expect(token).toBeNull();
        });
    });

    it('should fail to login if password is wrong', () => {
      const wrongPassword = faker.internet.password();
      return publicRequest(loginQuery(TEST_USER.email, wrongPassword))
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;

          expect(ok).toBe(false);
          expect(error).toBe('Wrong password');
          expect(token).toBeNull();
        });
    });
  });

  describe('userProfile', () => {
    const userProfileQuery = (userId: number): string => `
    {
      userProfile(input: {
        userId: ${userId}
       }) {
        ok
        error
        user {
          id
        }
      }
    }
    `;
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should find user's profile with given id", () => {
      return privateRequest(userProfileQuery(userId), jwtToken)
        .expect(200)
        .expect((res) => {
          const { ok, error, user } = res.body.data.userProfile;

          expect(ok).toBe(true);
          expect(error).toBeNull();
          expect(user.id).toBe(userId);
        });
    });

    it('should not find a profile with non-existing id', () => {
      const nonExistingId = 999;
      return privateRequest(userProfileQuery(nonExistingId), jwtToken)
        .expect(200)
        .expect((res) => {
          const { ok, error, user } = res.body.data.userProfile;

          expect(ok).toBe(false);
          expect(error).toBe('User not found with given id');
          expect(user).toBeNull();
        });
    });

    it('should fail if not logged in', () => {
      return publicRequest(userProfileQuery(userId))
        .expect(200)
        .expect((res) => {
          const { message } = res.body.errors[0];
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('me', () => {
    const meQuery = `
    {
      me {
        email
      }
    }
    `;

    it("should find logged in user's profile", () => {
      return privateRequest(meQuery, jwtToken)
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(TEST_USER.email);
        });
    });

    it('should fail if not logged in', () => {
      return publicRequest(meQuery)
        .expect(200)
        .expect((res) => {
          const { message } = res.body.errors[0];
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const newEmail = faker.internet.email();
    const newPassword = faker.internet.password();
    const newEmail2 = faker.internet.email();
    const newPassword2 = faker.internet.password();
    const editProfileQuery = (email: string, password: string) => `
    mutation {
      editProfile(input: {
        ${email ? `email: "${email}"` : ''}
        ${password ? `password: "${password}"` : ''}
      }) {
        ok
        error
      }
    }
    `;

    it('should change email', () => {
      return privateRequest(editProfileQuery(newEmail, null), jwtToken)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;

          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });

    it('should change password', () => {
      return privateRequest(editProfileQuery(null, newPassword), jwtToken)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;

          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });

    it('should change both email and password', () => {
      return privateRequest(editProfileQuery(newEmail2, newPassword2), jwtToken)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;

          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });

    it('should login successfully with new email and password', () => {
      return publicRequest(loginQuery(newEmail2, newPassword2))
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;

          expect(ok).toBe(true);
          expect(error).toBeNull();
          expect(token).toEqual(expect.any(String));
        });
    });

    it('should fail if not logged in', () => {
      return publicRequest(editProfileQuery(newEmail, newPassword))
        .expect(200)
        .expect((res) => {
          const { message } = res.body.errors[0];
          expect(message).toBe('Forbidden resource');
        });
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailQuery = (code: string): string => `
    mutation {
      verifyEmail(input: {
        code: "${code}"
      }) {
        ok
        error
      }
    }
    `;
    let verificationCode: string;

    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });

    it('should fail on wrong verification code', () => {
      const wrongCode = faker.random.alphaNumeric(20);
      return publicRequest(verifyEmailQuery(wrongCode))
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;

          expect(ok).toBe(false);
          expect(error).toBe('Verification not found with given code');
        });
    });

    it('should verify email', () => {
      return publicRequest(verifyEmailQuery(verificationCode))
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;

          expect(ok).toBe(true);
          expect(error).toBeNull();
        });
    });
  });
});
