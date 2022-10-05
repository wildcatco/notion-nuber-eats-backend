import { Test } from '@nestjs/testing';
import * as FormData from 'form-data';
import got from 'got';
import { MailService } from 'src/mail/mail.service';
import { CONFIG_OPTIONS } from './../common/common.constants';

jest.mock('got');
jest.mock('form-data');

const TEST_DOMAIN = 'test-domain';

describe('MailService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            fromEmail: 'test-fromEmail',
            domain: TEST_DOMAIN,
            apiKey: 'test-apiKey',
          },
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('be defined', () => {
    expect(mailService).toBeDefined();
  });

  describe('sendEmail', () => {
    it('sends email', async () => {
      const formSpy = jest.spyOn(FormData.prototype, 'append');

      const ok = await mailService.sendEmail('', '', [
        { key: 'one', value: '1' },
      ]);

      expect(formSpy).toBeCalled();
      expect(got.post).toBeCalledTimes(1);
      expect(got.post).toBeCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(ok).toBeTruthy();
    });

    it('fails on error', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });

      const ok = await mailService.sendEmail('', '', [
        { key: 'one', value: '1' },
      ]);

      expect(ok).toBeFalsy();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificationEmailInput = {
        email: 'email',
        code: 'code',
      };

      jest.spyOn(mailService, 'sendEmail').mockImplementation(async () => true);

      mailService.sendVerificationEmail(
        sendVerificationEmailInput.email,
        sendVerificationEmailInput.code,
      );

      expect(mailService.sendEmail).toBeCalledTimes(1);
      expect(mailService.sendEmail).toBeCalledWith(
        'Verify Your Email',
        'nuber-eats-confirm',
        [
          { key: 'username', value: sendVerificationEmailInput.email },
          { key: 'code', value: sendVerificationEmailInput.code },
        ],
      );
    });
  });
});
