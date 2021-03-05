import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { UserController } from './user.controller';
import { JwtModule } from 'src/jwt/jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { GoogleStrategy } from 'src/user/auth/google.strategy';

@Global()
@Module({
  imports: [JwtModule, TypeOrmModule.forFeature([User])],
  providers: [UserService, UserResolver, GoogleStrategy],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
