import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { AuthUser } from 'src/common/auth.user';
import { FindUserByIdInput, FindUserByIdOutput } from './dtos/findUserById.dto';
import { MeInput, MeOutput } from './dtos/me.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@UseGuards(AppAuthGuard)
@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @AllowedPermission('LogIn')
  @Query((returns) => FindUserByIdOutput)
  findUserById(
    @Args('input') input: FindUserByIdInput,
  ): Promise<FindUserByIdOutput> {
    return this.userService.findUserById(input);
  }

  @AllowedPermission('LogIn')
  @Query((returns) => MeOutput)
  me(@AuthUser() user: User, @Args('input') input: MeInput): Promise<MeOutput> {
    return this.userService.me(user, input);
  }
}
