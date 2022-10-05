import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { JwtService } from './../jwt/jwt.service';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

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

    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get<MockRepository<User>>(
      getRepositoryToken(User),
    );
    verificationsRepository = module.get<MockRepository<Verification>>(
      getRepositoryToken(Verification),
    );
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountInput = {
      email: 'test@mail.com',
      password: 'testPassword',
      role: UserRole.Client,
    };

    it('should fail if email is already in use', async () => {
      usersRepository.findOneBy.mockResolvedValue({
        id: 1,
        email: 'test@mail.com',
      });

      const result = await usersService.createAccount(createAccountInput);

      expect(result).toEqual({
        ok: false,
        error: 'Email is already in use',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOneBy.mockReturnValue(null);
      usersRepository.save.mockResolvedValue(createAccountInput);
      verificationsRepository.save.mockResolvedValue({ code: 'random-code' });

      const result = await usersService.createAccount(createAccountInput);

      expect(usersRepository.create).toBeCalledWith(createAccountInput);
      expect(verificationsRepository.create).toBeCalledWith({
        user: createAccountInput,
      });
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        createAccountInput.email,
        'random-code',
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
      email: 'test@mail.com',
      password: 'testPassword',
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
      const mockedUser = {
        checkPassword: jest.fn().mockResolvedValue(false),
      };
      usersRepository.findOneBy.mockResolvedValue(mockedUser);

      const result = await usersService.login(loginInput);

      expect(result).toEqual({
        ok: false,
        error: 'Wrong password',
      });
    });

    it('should return token if login is successful', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn().mockResolvedValue(true),
      };
      usersRepository.findOneBy.mockResolvedValue(mockedUser);

      const result = await usersService.login(loginInput);

      expect(jwtService.sign).toBeCalledWith(mockedUser.id);
      expect(result).toEqual({
        ok: true,
        token: 'signed-token',
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
      userId: 1,
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
      usersRepository.findOneBy.mockResolvedValue({ id: 1 });

      const result = await usersService.findById(findByIdInput);

      expect(result).toEqual({
        ok: true,
        user: { id: 1 },
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOneBy.mockRejectedValue(new Error());

      const result = await usersService.findById(findByIdInput);

      expect(result).toEqual({ ok: false, error: 'Failed to find user' });
    });
  });

  describe('editProfile', () => {
    const userId = 1;
    const editProfileInput = {
      email: 'updated@mail.com',
      password: 'updatedPassword',
    };
    const verificationId = 10;
    const verificationCode = 'random-code';

    it('should fail if email is already in use', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 2 });

      const result = await usersService.editProfile(userId, editProfileInput);

      expect(result).toEqual({ ok: false, error: 'Email is already in use' });
    });

    it('should change email', async () => {
      const newUser = {
        email: editProfileInput.email,
      };
      usersRepository.findOneBy.mockResolvedValueOnce(null);
      usersRepository.findOneBy.mockResolvedValue(newUser);
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
      expect(verificationsRepository.create).toBeCalledWith({ user: newUser });
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        newUser.email,
        verificationCode,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should change password', async () => {
      const user = {
        password: 'oldPassword',
      };
      usersRepository.findOneBy.mockResolvedValueOnce(user);

      const result = await usersService.editProfile(userId, {
        ...editProfileInput,
        email: undefined,
      });

      expect(usersRepository.save).toBeCalledWith({
        password: editProfileInput.password,
      });
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
      code: 'random-code',
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
      const mockedVerification = {
        id: 10,
        user: {
          id: 1,
        },
      };
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await usersService.verifyEmail(verifyEmailInput);

      expect(usersRepository.update).toBeCalledWith(
        mockedVerification.user.id,
        {
          verified: true,
        },
      );
      expect(verificationsRepository.delete).toBeCalledWith(
        mockedVerification.id,
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
