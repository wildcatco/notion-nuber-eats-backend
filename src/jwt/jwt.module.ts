import { DynamicModule, Module } from '@nestjs/common';
import { Global } from '@nestjs/common/decorators';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

@Global()
@Module({})
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [JwtService, { provide: CONFIG_OPTIONS, useValue: options }],
    };
  }
}
