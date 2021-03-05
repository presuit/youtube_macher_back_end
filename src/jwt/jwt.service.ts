import { Inject, Injectable } from '@nestjs/common';
import { JWT_OPTIONS, IJwtOptions, IJwtTokenPayload } from './jwt.types';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(@Inject(JWT_OPTIONS) private readonly jwtOptions: IJwtOptions) {}

  generateJwtToken(payload: IJwtTokenPayload): string {
    return jwt.sign({ ...payload }, this.jwtOptions.jwtSecret, {
      expiresIn: '10h',
    });
  }

  verifyJwtToken(token: string): object | string | IJwtTokenPayload {
    return jwt.verify(token, this.jwtOptions.jwtSecret);
  }
}
