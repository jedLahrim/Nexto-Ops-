import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { GetUser } from './get-user.decorator';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from './dto/login-user.dto';
import { UserService } from './user.service';
import { SocialLoginDto } from './dto/social-login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PhoneNumberLoginDto } from './dto/phone-number-login.dto';
import { HashGuard } from './guards/hash.guard';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import { LoginSuperUserDto } from './dto/login-super-user.dto';
import { ResetSuperUserPasswordDto } from './dto/reset-super-user-password.dto';
import { CUPermissionUserDto } from './dto/c-u-permission-user.dto';
import { JwtAuthGuard, JwtGetUserGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { UserPermissionsType } from './enums/user-permission.enum';
import { CreateBusinessUserDto } from './dto/create-business-user.dto';
import { UserTypeGuard } from './guards/user-type.guard';
import { UserType } from './enums/user-type.enum';
import { I18n, I18nContext } from 'nestjs-i18n';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { GenerateMagicLinkDto } from './dto/generate-magic-link.dto';
import { MagicLoginDto } from './dto/magic-login.dto';
import { SendMagicLinkDto } from './dto/send-magic-link.dto';
import { FilterNodeDto } from './dto/filter-node.dto';
import { Pagination } from '../commons/pagination/pagination';
import { ParentNodeDto } from './dto/parent-node.dto';
import { SetToDefaultPermissionUserDto } from './dto/set-to-default-permission.dto';
import { UpdateUserVipDto } from './dto/update-user-vip.dto';
import { CreateGuestDto } from './dto/create-guest.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtGetUserGuard)
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @I18n() i18n: I18nContext, @GetUser() user?: User) {
    const guestUser = user?.isGuest ? user : null;
    return this.userService.register(createUserDto, i18n, true, null, guestUser);
  }

  @UseGuards(HashGuard)
  @Post('admin/register')
  async registerSuperUser(@Body() dto: CreateSuperUserDto) {
    return await this.userService.registerSuperUser(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_BUSINESS_ACCOUNT))
  @Post('business/register')
  async registerBusiness(@Body() dto: CreateBusinessUserDto, @GetUser() user: User) {
    return await this.userService.registerBusiness(dto, user);
  }

  @Post('admin/login')
  async loginSuperUser(@Body() dto: LoginSuperUserDto) {
    return await this.userService.loginSuperUser(dto);
  }

  @Post('admin/reset-email')
  async sendSuperUserResetEmail(@Body('email') email: string) {
    return await this.userService.sendSuperUserResetEmail(email);
  }

  @Post('admin/reset-password')
  async resetSuperUserPassword(@Body() dto: ResetSuperUserPasswordDto) {
    return await this.userService.resetSuperUserPassword(dto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<void> {
    return this.userService.login(loginUserDto);
  }

  @Post('refresh-token')
  async refreshToken(@Body('refresh') refresh: string): Promise<User> {
    return this.userService.refreshToken(refresh);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@GetUser() user: User) {
    return this.userService.me(user);
  }

  @Patch('')
  @UseGuards(JwtAuthGuard)
  async update(@GetUser() user: User, @Body() dto: UpdateUserDto) {
    if (dto.userId) {
      await this.userService.checkCanManageNode(user, dto.userId, [UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS]);
    }
    return this.userService.update(user, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  remove(@GetUser() user: User) {
    return this.userService.remove({ id: user.id, deleteUser: user });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeById(@GetUser() user: User, @Param('id') id: string) {
    if (id) {
      await this.userService.checkCanManageNode(user, id, [UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS]);
    }
    return this.userService.remove({ id }, false);
  }

  @UseGuards(JwtGetUserGuard)
  @Post('social-login')
  async socialLogin(
    @Body() socialLoginDto: SocialLoginDto,
    @I18n() i18n: I18nContext,
    @GetUser() user?: User,
  ): Promise<any> {
    return this.userService.socialLogin(socialLoginDto, i18n, user);
  }

  @Post('phone-login')
  @UseGuards(HashGuard)
  async phoneNumberLogin(@Body() phoneNumberLoginDto: PhoneNumberLoginDto, @I18n() i18n: I18nContext): Promise<User> {
    return this.userService.phoneNumberLogin(phoneNumberLoginDto, i18n);
  }

  @Post('verify-email')
  async verifyEmail(@Body('code') code: string) {
    return this.userService.verifyEmail(code);
  }

  @Post('permissions')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async addPermissions(@Body() dto: CUPermissionUserDto) {
    return this.userService.addPermissions(dto);
  }

  @Patch('permissions')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async updatePermissions(@Body() dto: CUPermissionUserDto) {
    return this.userService.updatePermissions(dto);
  }

  @Post('permissions/set-to-default')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async setToDefaultPermissions(@Body() dto: SetToDefaultPermissionUserDto) {
    return this.userService.setToDefaultPermissions(dto);
  }

  @Post('callbacks/sign-in-with-apple')
  async callbackSignInWithApple(@Body() body: any, @Res() res: any) {
    return this.userService.callbackSignInWithApple(body, res);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_CREATE_ACCOUNT))
  @Post('many/:parentNodeId?')
  async createMany(@Body() dtos: CreateUserDto[], @GetUser() user: User, @Param('parentNodeId') parentNodeId?: string) {
    if (parentNodeId) {
      await this.userService.checkCanManageNode(user, parentNodeId, [
        UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS,
      ]);
    }
    return await this.userService.createMany(dtos, user, parentNodeId);
  }

  @Post('magic-link/verify')
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto, @I18n() i18n: I18nContext) {
    return await this.userService.verifyMagicLink(dto, i18n);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_CREATE_ACCOUNT))
  @Post('magic-link/generate')
  async generateMagicLink(@Body() dto: GenerateMagicLinkDto, @GetUser() user: User) {
    return await this.userService.generateMagicLink(dto, user);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_CREATE_ACCOUNT))
  @Post('magic-login')
  async magicLogin(@Body() dto: MagicLoginDto, @GetUser() user: User) {
    return await this.userService.magicLogin(dto, user);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_CREATE_ACCOUNT))
  @Post('nodes/can-manage')
  async checkCanManageNode(
    @Body('childNodeId') childNodeId: string,
    @GetUser() user: User,
    @Body('requiredPermissions') requiredPermissions: UserPermissionsType[],
  ) {
    return await this.userService.checkCanManageNode(user, childNodeId, requiredPermissions);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_CREATE_ACCOUNT))
  @Post('magic-link/send')
  async sendMagicLink(@Body() dto: SendMagicLinkDto[], @GetUser() user: User) {
    return await this.userService.sendMagicLink(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes')
  async findAllNodes(@Param('id') nodeUserId: string, @Query() dto: FilterNodeDto) {
    return await this.userService.findAllNodes(nodeUserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes/parent')
  async findParentNode(@Param('id') nodeUserId: string) {
    return await this.userService.findParentNode(nodeUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes/ancestors')
  async findAllAncestorsNodes(@Param('id') nodeUserId: string): Promise<User[]> {
    return await this.userService.findAllAncestorsNodes(nodeUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes/siblings')
  async findAllSiblingsNodes(@Param('id') nodeUserId: string, @Query() dto: FilterNodeDto): Promise<Pagination<User>> {
    dto.depth = 0;
    return await this.userService.findAllNodes(nodeUserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes/children')
  async findAllChildrenNodes(@Param('id') nodeUserId: string, @Query() dto: FilterNodeDto): Promise<Pagination<User>> {
    // get only my children
    dto.depth = 1;
    return await this.userService.findAllNodes(nodeUserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes/descendants')
  async findAllDescendantsNodes(
    @Param('id') nodeUserId: string,
    @Query() dto: FilterNodeDto,
  ): Promise<Pagination<User>> {
    // get all my children
    dto.depth = null;
    return await this.userService.findAllNodes(nodeUserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/nodes/parent/top-level')
  async findTopLevelParentNode(@Param('id') nodeUserId: string, @Body() dto: ParentNodeDto) {
    return await this.userService.findTopLevelParentNode(nodeUserId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    if (id == user.id) return user;
    await this.userService.checkCanManageNode(user, id, [UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS]);
    return this.userService.findOne(id);
  }

  @Post(':id/vip')
  @UseGuards(JwtAuthGuard, UserTypeGuard([UserType.SUPER_USER]))
  async updateVip(@Param('id') id: string, @Body() dto: UpdateUserVipDto, @GetUser() user: User) {
    return await this.userService.updateVip(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/register/reset')
  async restUserRegister(@GetUser() user: User, @I18n() i18n: I18nContext) {
    return this.userService.restUserRegister(user, i18n);
  }

  @Post('/register/guest')
  async guest(@Body() createGuestDto: CreateGuestDto, @I18n() i18n: I18nContext) {
    return this.userService.guest(createGuestDto, i18n);
  }
}
