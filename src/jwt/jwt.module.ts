import { DynamicModule, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import { JwtService } from './jwt.service';

@Module({})
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [JwtService, { provide: CONFIG_OPTIONS, useValue: options }],
      global: options?.isGlobal,
    };
  }
}
