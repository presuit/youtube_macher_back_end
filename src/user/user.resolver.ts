import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { AppAuthGuard } from 'src/common/app.guard';
import { AllowedPermission } from 'src/common/auth.roles';
import { FindUserByIdInput, FindUserByIdOutput } from './dtos/findUserById.dto';
import { UserService } from './user.service';

@UseGuards(AppAuthGuard)
@Resolver()
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @AllowedPermission('LogIn')
  @Query((returns) => String)
  hiiii() {
    return 'jgfioghwroui';
  }

  @AllowedPermission('LogIn')
  @Query((returns) => FindUserByIdOutput)
  findUserById(
    @Args('input') input: FindUserByIdInput,
  ): Promise<FindUserByIdOutput> {
    return this.userService.findUserById(input);
  }
}
