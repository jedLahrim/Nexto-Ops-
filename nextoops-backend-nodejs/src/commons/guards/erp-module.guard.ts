import { CanActivate, ExecutionContext, ForbiddenException, Injectable, mixin, Type } from '@nestjs/common';
import { AppError } from '../errors/app-error';
import { ERR_ERP_MODULE_FORBIDDEN } from '../errors/erp-error-codes';
import { UserType } from '../../user/enums/user-type.enum';

/**
 * v10.1 module-scoped write gate — NestJS guard equivalent of the source's
 * `canWriteEntity` check inside `adminMutation`.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, ErpModuleGuard('incidents'))
 *
 * Every audit-logged mutation declares its `entity` — that entity maps to
 * the permission module that governs it. Admins always pass; non-admin
 * users may write if their `canUse` list contains the module. Unmapped
 * entities stay admin-only.
 */

const ENTITY_MODULE_MAP: Record<string, string[]> = {
  asset: ['inventory'],
  department: ['org'],
  room: ['org'],
  incident: ['incidents'],
  problem: ['problems'],
  changeRequest: ['changes'],
  stockItem: ['stock'],
  vendor: ['vendors'],
  purchaseRequest: ['procurement'],
  purchaseOrder: ['procurement'],
  contract: ['contracts'],
  license: ['licenses'],
  maintenance: ['maintenance'],
  risk: ['risks'],
  budget: ['budget'],
};

export function ErpModuleGuard(entity: string): Type<CanActivate> {
  @Injectable()
  class ErpModuleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new ForbiddenException(new AppError(ERR_ERP_MODULE_FORBIDDEN));
      }

      // ERP admin role bypasses all module checks
      if (user.type === UserType.SUPER_USER) return true;

      const permissionModules = ENTITY_MODULE_MAP[entity];
      // Not mapped → admin-only
      if (!permissionModules) {
        throw new ForbiddenException(
          new AppError(ERR_ERP_MODULE_FORBIDDEN, {
            message: 'You do not have permission to make changes in this module. Ask your IT administrator for access.',
          }),
        );
      }

      // TODO: Implement fine-grained module access control using UserPermissionsType
      // For now, only SUPER_USER can access these modules.
      const allowed: string[] = [];
      const hasAccess = permissionModules.some((m) => allowed.includes(m));

      if (!hasAccess) {
        throw new ForbiddenException(
          new AppError(ERR_ERP_MODULE_FORBIDDEN, {
            message: 'You do not have permission to make changes in this module. Ask your IT administrator for access.',
          }),
        );
      }

      return true;
    }
  }

  return mixin(ErpModuleGuardMixin);
}
