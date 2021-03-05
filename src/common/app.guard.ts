import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { UserService } from 'src/user/user.service';
import { Permission } from './auth.roles';

@Injectable()
export class AppAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission: Permission = this.reflector.get(
      'permission',
      context.getHandler(),
    );
    if (permission === 'Allowed') {
      return true;
    }

    const ctx = GqlExecutionContext.create(context).getContext();
    if (ctx?.req?.headers['x-jwt']) {
      const decoded = this.jwtService.verifyJwtToken(ctx.req.headers['x-jwt']);
      if (decoded && typeof decoded === 'object') {
        const { ok, error, user } = await this.userService.findUserById({
          id: decoded['id'],
        });
        if (ok && user) {
          ctx.req.user = user;
          return true;
        } else {
          console.log(error);
        }
      }
    }
    return false;
  }
}
