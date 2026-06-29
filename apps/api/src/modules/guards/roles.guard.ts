import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import { AuthService } from "../services/auth.service.js";
import type { RequestWithUser } from "./session.guard.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    request.user = await this.auth.verifySessionToken(request.cookies.qms_session);

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!roles?.length || roles.includes(request.user.role)) return true;

    throw new ForbiddenException("Insufficient role");
  }
}

