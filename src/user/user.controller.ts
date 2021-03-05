import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { LogInOrCreateUserOutput } from './dtos/logInOrCreateUser.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/auth')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('/auth/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request): Promise<LogInOrCreateUserOutput> {
    return this.userService.loginOrCreateUser(req);
  }
}
