import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { JwtModule } from 'src/jwt/jwt.module';
import { UserModule } from 'src/user/user.module';
import { PUB_SUB } from './common.constants';

@Global()
@Module({
  imports: [JwtModule, UserModule],
  providers: [{ provide: PUB_SUB, useValue: new PubSub() }],
  exports: [PUB_SUB],
})
export class CommonModule {}
