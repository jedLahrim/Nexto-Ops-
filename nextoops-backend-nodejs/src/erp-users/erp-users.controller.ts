import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { UserTypeGuard } from '../user/guards/user-type.guard';
import { UserType } from '../user/enums/user-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { GetUser } from '../user/get-user.decorator';
import * as bcrypt from 'bcrypt';
import { Permission } from '../commons/permissions/permissions';

/**
 * ERP admin controller for managing users.
 * Mounted at /users (plural) — separate from the core /user controller.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
export class ErpUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  /** List all users for the admin panel. */
  @Get()
  async findAll() {
    return await this.userRepo.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'fullName', 'type', 'activated', 'createdAt', 'updatedAt', 'lastLoginAt', 'phoneNumber'],
    });
  }

  /** Create a new ERP user. */
  @Post()
  async create(
    @Body() dto: { username: string; email?: string; name?: string; pin?: string; role?: string },
    @GetUser() admin: User,
  ) {
    const hashedPassword = dto.pin ? await bcrypt.hash(dto.pin, 10) : undefined;

    const user = this.userRepo.create({
      email: dto.email || dto.username,
      fullName: dto.name,
      password: hashedPassword,
      type: dto.role === 'admin' ? UserType.SUPER_USER : UserType.MEMBER,
      activated: true,
      permissions:
        dto.role === 'admin' ? Permission.SUPER_USER_DEFAULT_PERMISSIONS : Permission.MEMBER_DEFAULT_PERMISSIONS,
    });

    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.create',
      entity: 'user',
      entityId: saved.id,
      details: `Created user ${saved.email}`,
    });

    return { id: saved.id, username: saved.email, email: saved.email };
  }

  /** Update user profile (name, email). */
  @Patch(':id/profile')
  async updateProfile(@Param('id') id: string, @Body() dto: { name?: string; email?: string }, @GetUser() admin: User) {
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    if (dto.name !== undefined) user.fullName = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.updateProfile',
      entity: 'user',
      entityId: id,
      details: JSON.stringify(dto),
    });

    return saved;
  }

  /** Update username (email). */
  @Patch(':id/username')
  async updateUsername(@Param('id') id: string, @Body() dto: { username: string }, @GetUser() admin: User) {
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    user.email = dto.username;
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.updateUsername',
      entity: 'user',
      entityId: id,
      details: `Username changed to ${dto.username}`,
    });

    return saved;
  }

  /** Reset a user's PIN/password. */
  @Post(':id/reset-pin')
  async resetPin(@Param('id') id: string, @Body() dto: { pin: string }, @GetUser() admin: User) {
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    user.password = await bcrypt.hash(dto.pin, 10);
    await this.userRepo.save(user);

    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.resetPin',
      entity: 'user',
      entityId: id,
    });

    return { success: true };
  }

  /** Toggle user active status. */
  @Patch(':id/active')
  async setActive(@Param('id') id: string, @Body() dto: { active: boolean }, @GetUser() admin: User) {
    const user = await this.userRepo.findOneOrFail({ where: { id } });
    user.activated = dto.active;
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: dto.active ? 'user.activate' : 'user.deactivate',
      entity: 'user',
      entityId: id,
    });

    return saved;
  }

  /** Set user role/type. */
  @Patch(':id/role')
  async setRole(@Param('id') id: string, @Body() dto: { role: string }, @GetUser() admin: User) {
    const user = await this.userRepo.findOneOrFail({ where: { id } });

    // Map frontend role names to backend UserType
    const roleMap: Record<string, UserType> = {
      admin: UserType.SUPER_USER,
      user: UserType.WORKER,
      member: UserType.MEMBER,
    };
    user.type = roleMap[dto.role] ?? UserType.MEMBER;
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.setRole',
      entity: 'user',
      entityId: id,
      details: `Role set to ${dto.role}`,
    });

    return saved;
  }

  /** Set per-user module permissions (placeholder — stored in user metadata). */
  @Put(':id/permissions')
  async setPermissions(@Param('id') id: string, @Body() dto: { modules: string[] }, @GetUser() admin: User) {
    // For now, acknowledge the request. Full module-level permissions
    // will be implemented when we add canUse-style column to User entity.
    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.setPermissions',
      entity: 'user',
      entityId: id,
      details: JSON.stringify(dto.modules),
    });

    return { success: true, modules: dto.modules };
  }

  /** Assign a permission set to a user (placeholder). */
  @Put(':id/roles/:roleId')
  async assignPermissionSet(@Param('id') id: string, @Param('roleId') roleId: string, @GetUser() admin: User) {
    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.assignPermissionSet',
      entity: 'user',
      entityId: id,
      details: `Assigned permission set ${roleId}`,
    });

    return { success: true };
  }

  /** Clear permission set from a user (placeholder). */
  @Delete(':id/roles')
  async clearPermissionSet(@Param('id') id: string, @GetUser() admin: User) {
    await this.auditService.log({
      userId: admin.id,
      userLabel: admin.email,
      action: 'user.clearPermissionSet',
      entity: 'user',
      entityId: id,
    });

    return { success: true };
  }
}
