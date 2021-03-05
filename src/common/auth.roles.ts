import { SetMetadata } from '@nestjs/common';

export type Permission = 'Allowed' | 'LogIn';

export const AllowedPermission = (permission: Permission) =>
  SetMetadata('permission', permission);
