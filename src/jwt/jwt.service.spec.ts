import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';

const TEST_KEY = 'testKey';
const TOKEN = 'TOKEN';
const USER_ID = 777;

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => TOKEN),
    verify: jest.fn(() => ({ id: USER_ID })),
  };
});

describe('JwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      const token = service.sign(USER_ID);

      expect(jwt.sign).toBeCalledTimes(1);
      expect(jwt.sign).toBeCalledWith({ id: USER_ID }, TEST_KEY);
      expect(token).toBe(TOKEN);
    });
  });

  describe('verify', () => {
    it('should return the decoded token', () => {
      const decoded = service.verify(TOKEN);

      expect(jwt.verify).toBeCalledTimes(1);
      expect(jwt.verify).toBeCalledWith(TOKEN, TEST_KEY);
      expect(decoded).toEqual({ id: USER_ID });
    });
  });
});
