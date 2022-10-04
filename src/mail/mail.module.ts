import { DynamicModule, Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from 'src/mail/mail.service';
import { MailModuleOptions } from './mail.interfaces';

@Global()
@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      module: MailModule,
      providers: [{ provide: CONFIG_OPTIONS, useValue: options }, MailService],
      exports: [MailService],
    };
  }
}
