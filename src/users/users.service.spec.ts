import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { mockRepository } from 'src/test-common/helpers';
import { MockRepository } from 'src/test-common/types';
import { JwtService } from './../jwt/jwt.service';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

const JWT_SIGNED_TOKEN = faker.random.alphaNumeric(20);

const mockJwtService = {
  sign: jest.fn().mockReturnValue(JWT_SIGNED_TOKEN),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    usersService = module.get(UsersService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountInput = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      role: UserRole.Client,
    };

    it('should fail if email is already in use', async () => {
      const emailInUse = true;
      usersRepository.findOneBy.mockResolvedValue(emailInUse);

      const result = await usersService.createAccount(createAccountInput);

      expect(result).toEqual({
        ok: false,
        error: 'Email is already in use',
      });
    });

    it('should create a new user', async () => {
      const createdUser = {
        email: createAccountInput.email,
      };
      const createdVerification = {
        code: faker.random.alphaNumeric(20),
      };

      usersRepository.findOneBy.mockReturnValue(null);
      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.save.mockResolvedValue(createdUser);
      verificationsRepository.create.mockReturnValue(createdVerification);
      verificationsRepository.save.mockResolvedValue(createdVerification);

      const result = await usersService.createAccount(createAccountInput);

      expect(usersRepository.create).toBeCalledWith(createAccountInput);
      expect(usersRepository.save).toBeCalledWith(createdUser);
      expect(verificationsRepository.create).toBeCalledWith({
        user: createdUser,
      });
      expect(verificationsRepository.save).toBeCalledWith(createdVerification);
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        createAccountInput.email,
        createdVerification.code,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOneBy.mockRejectedValue(new Error());

      const result = await usersService.createAccount(createAccountInput);

      expect(result).toEqual({ ok: false, error: 'Failed to create account' });
    });
  });

  describe('login', () => {
    const loginInput = {
      email: faker.internet.email(),
      password: faker.internet.password(),
    };

    it('should fail if user with given email does not exist', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await usersService.login(loginInput);

      expect(result).toEqual({
        ok: false,
        error: 'User not found with given email',
      });
    });

    it('should fail if given password is wrong', async () => {
      const foundUser = {
        checkPassword: jest.fn().mockResolvedValue(false),
      };
      usersRepository.findOneBy.mockResolvedValue(foundUser);

      const result = await usersService.login(loginInput);

      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    it('should return token if login is successful', async () => {
      const foundUser = {
        id: faker.datatype.number(),
        checkPassword: jest.fn().mockResolvedValue(true),
      };
      usersRepository.findOneBy.mockResolvedValue(foundUser);

      const result = await usersService.login(loginInput);

      expect(jwtService.sign).toBeCalledWith(foundUser.id);
      expect(result).toEqual({
        ok: true,
        token: JWT_SIGNED_TOKEN,
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOneBy.mockRejectedValue(new Error());

      const result = await usersService.login(loginInput);

      expect(result).toEqual({ ok: false, error: 'Failed to login' });
    });
  });

  describe('findById', () => {
    const findByIdInput = {
      userId: faker.datatype.number(),
    };

    it('should fail if user does not exist with given id', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await usersService.findById(findByIdInput);

      expect(result).toEqual({
        ok: false,
        error: 'User not found with given id',
      });
    });

    it('should return user with given id', async () => {
      const foundUser = {
        id: findByIdInput.userId,
      };
      usersRepository.findOneBy.mockResolvedValue(foundUser);

      const result = await usersService.findById(findByIdInput);

      expect(result).toEqual({
        ok: true,
        user: foundUser,
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOneBy.mockRejectedValue(new Error());

      const result = await usersService.findById(findByIdInput);

      expect(result).toEqual({ ok: false, error: 'Failed to find user' });
    });
  });

  describe('editProfile', () => {
    const userId = faker.datatype.number();
    const editProfileInput = {
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
    const verificationId = faker.datatype.number();
    const verificationCode = faker.random.alphaNumeric(20);

    it('should fail if email is already in use', async () => {
      usersRepository.findOneBy.mockResolvedValue(true);

      const result = await usersService.editProfile(userId, editProfileInput);

      expect(result).toEqual({ ok: false, error: 'Email is already in use' });
    });

    it('should change email', async () => {
      const updatedUser = {
        email: editProfileInput.email,
      };
      usersRepository.findOneBy.mockResolvedValueOnce(null);
      usersRepository.findOneBy.mockResolvedValue(updatedUser);
      verificationsRepository.findOneBy.mockResolvedValue({
        id: verificationId,
      });
      verificationsRepository.save.mockResolvedValue({
        code: verificationCode,
      });

      const result = await usersService.editProfile(userId, {
        ...editProfileInput,
        password: undefined,
      });

      expect(usersRepository.update).toBeCalledWith(userId, {
        email: editProfileInput.email,
        verified: false,
      });
      expect(verificationsRepository.findOneBy).toBeCalledWith({
        user: { id: userId },
      });
      expect(verificationsRepository.delete).toBeCalledWith(verificationId);
      expect(verificationsRepository.create).toBeCalledWith({
        user: updatedUser,
      });
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        updatedUser.email,
        verificationCode,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should change password', async () => {
      const foundUser = {
        password: faker.internet.password(),
      };
      const updatedUser = {
        password: editProfileInput.password,
      };
      usersRepository.findOneBy.mockResolvedValueOnce(foundUser);

      const result = await usersService.editProfile(userId, {
        ...editProfileInput,
        email: undefined,
      });

      expect(usersRepository.save).toBeCalledWith(updatedUser);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());

      const result = await usersService.editProfile(userId, editProfileInput);

      expect(result).toEqual({ ok: false, error: 'Failed to edit profile' });
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailInput = {
      code: faker.random.alphaNumeric(20),
    };

    it('should fail if verification with given code does not exist', async () => {
      verificationsRepository.findOne.mockResolvedValue(null);

      const result = await usersService.verifyEmail(verifyEmailInput);

      expect(result).toEqual({
        ok: false,
        error: 'Verification not found with given code',
      });
    });

    it('should verify email', async () => {
      const foundVerification = {
        id: faker.datatype.number(),
        user: {
          id: faker.datatype.number(),
        },
      };
      verificationsRepository.findOne.mockResolvedValue(foundVerification);

      const result = await usersService.verifyEmail(verifyEmailInput);

      expect(usersRepository.update).toBeCalledWith(foundVerification.user.id, {
        verified: true,
      });
      expect(verificationsRepository.delete).toBeCalledWith(
        foundVerification.id,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(new Error());

      const result = await usersService.verifyEmail(verifyEmailInput);

      expect(result).toEqual({ ok: false, error: 'Failed to verify email' });
    });
  });
});
