import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from 'src/jwt/jwt.module';
import { UserModule } from 'src/user/user.module';
import { AppAuthGuard } from './app.guard';

@Module({
  imports: [JwtModule, UserModule],
})
export class CommonModule {}
