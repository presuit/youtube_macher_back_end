import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { JwtService } from 'src/jwt/jwt.service';
import { Repository } from 'typeorm';
import { FindUserByIdInput, FindUserByIdOutput } from './dtos/findUserById.dto';
import { LogInOrCreateUserOutput } from './dtos/logInOrCreateUser.dto';
import { MeInput, MeOutput } from './dtos/me.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async loginOrCreateUser(req: Request): Promise<LogInOrCreateUserOutput> {
    try {
      if (!req.user) {
        return { ok: false, error: 'Google Login Failed' };
      }
      let user = await this.users.findOne({ googleId: req.user['googleId'] });
      if (!user) {
        user = this.users.create({ ...req.user });
      }
      if (user.accessToken !== req.user['accessToken']) {
        user.accessToken = req.user['accessToken'];
      }
      await this.users.save(user);
      const authToken = this.jwtService.generateJwtToken({
        id: user.id,
      });
      return { ok: true, authToken };
    } catch (error) {
      console.log(error);
      return { ok: false, error };
    }
  }

  async findUserById({
    id,
    relations,
  }: FindUserByIdInput): Promise<FindUserByIdOutput> {
    try {
      const user = await this.users.findOneOrFail(id, {
        ...(relations && { relations: [...relations] }),
      });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async me(user: User, { relations }: MeInput): Promise<MeOutput> {
    try {
      const me = await this.users.findOne(user.id, {
        ...(relations && { relations: [...relations] }),
      });

      return { ok: true, me };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
