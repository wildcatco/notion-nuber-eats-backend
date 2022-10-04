import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AllowedRoles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    if (!roles) return true;

    const gqlContext = GqlExecutionContext.create(context).getContext<{
      user: User;
    }>();
    const user = gqlContext['user'];

    if (!user) return false;
    if (roles.includes('Any')) return true;
    return roles.includes(user.role);
  }
}