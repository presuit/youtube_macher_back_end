import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { IJwtOptions, JWT_OPTIONS } from './jwt.types';

@Global()
@Module({})
export class JwtModule {
  static forRoot(jwtOptions: IJwtOptions): DynamicModule {
    return {
      module: JwtModule,
      providers: [JwtService, { provide: JWT_OPTIONS, useValue: jwtOptions }],
      exports: [JwtService],
    };
  }
}
