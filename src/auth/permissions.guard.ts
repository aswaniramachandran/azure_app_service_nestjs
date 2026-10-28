import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './permissions';
import { UserRole } from '../users/user.entity';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException();

    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (user.role !== UserRole.ADMIN || !required?.length) {
      throw new ForbiddenException('Admins only');
    }
    if (!required.every((p) => user.permissions?.includes(p))) {
      throw new ForbiddenException('You do not have permission for this action');
    }
    return true;
  }
}