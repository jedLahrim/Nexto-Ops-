import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, In, Not, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AppError } from '../commons/errors/app-error';
import {
  ERR_ACCOUNT_WITH_EMAIL_ALREADY_REGISTERED,
  ERR_APPLE_API,
  ERR_CODE_ALREADY_USED,
  ERR_EMAIL_ALREADY_EXIST,
  ERR_EMAIL_NOT_FOUND,
  ERR_EMAIL_OR_PASSWORD_IS_INCORRECT,
  ERR_EXPIRED_CODE,
  ERR_GENERATE_FIREBASE_DYNAMIC_LINK,
  ERR_GENERATE_TOKEN,
  ERR_GOOGLE_API,
  ERR_INCORRECT_CODE,
  ERR_MERGE_USERS_DATA,
  ERR_NOT_FOUND_ATTACHMENT,
  ERR_NOT_FOUND_USER,
  ERR_PERMISSIONS_UNAUTHORIZED,
  ERR_TOKEN_ALREADY_USED,
  ERR_UNAUTHORIZED,
  ERR_USER_ALREADY_EXIST,
} from '../commons/errors/errors-codes';
import { LoginUserDto } from './dto/login-user.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UpdateUserDto } from './dto/update-user.dto';
import { Constant } from '../commons/constant';
import { VerificationCode } from './entities/verification-code.entity';
import { UserType } from './enums/user-type.enum';
import { toMs } from 'ms-typescript';
import { Attachment } from '../attachments/entities/attachment.entity';
import { v4 as uuid } from 'uuid';
import { PhoneNumberLoginDto } from './dto/phone-number-login.dto';
import { TokensService } from '../tokens/tokens.service';
import { RegisterProviderType, SocialLoginDto } from './dto/social-login.dto';
import { CreateSuperUserDto } from './dto/create-super-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginSuperUserDto } from './dto/login-super-user.dto';
import { ResetSuperUserPasswordDto } from './dto/reset-super-user-password.dto';
import { Permission } from '../commons/permissions/permissions';
import { CUPermissionUserDto } from './dto/c-u-permission-user.dto';
import { MailService } from '../mail/mail.service';
import * as moment from 'moment';
import { CreateBusinessUserDto } from './dto/create-business-user.dto';
import { AttachmentType } from '../attachments/enums/attachment-type';
import { I18nContext } from 'nestjs-i18n';
import { NotificationDto } from '../notifications/dto/push-notification.dto';
import { NotificationType } from '../notifications/enum/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as appleSignIn from 'apple-signin';
import * as userCountry from './assets/countries.json';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { ShareService } from '../share/share.service';
import { Token } from '../tokens/entities/token.entity';
import { MagicLoginDto } from './dto/magic-login.dto';
import { GenerateMagicLinkDto } from './dto/generate-magic-link.dto';
import { MagicLinkPayload } from './jwt-playload.interface';
import { isEmpty, sample, values } from 'lodash';
import { getUtcOffsetByTimezone, Utils } from '../commons/utils';
import { SendMagicLinkDto } from './dto/send-magic-link.dto';
import { Pagination } from '../commons/pagination/pagination';
import { FilterNodeDto, NodeOrderBy } from './dto/filter-node.dto';
import { UserPermissionsType } from './enums/user-permission.enum';
import { ParentNodeDto } from './dto/parent-node.dto';
import { SortType } from '../commons/enums/sortType';
import { SetToDefaultPermissionUserDto } from './dto/set-to-default-permission.dto';
import { UpdateUserVipDto } from './dto/update-user-vip.dto';
import { AttachmentsService } from '../attachments/attachments.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PermissionService } from '../permission/permission.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppService } from '../app.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { DataMergeTypeEnum } from './enums/data-merge-type.enum';
import { UserPost } from '../posts/entities/user-post.entity';
import { SubscriptionChangedEvent } from '../event-listeners/events/subscription-changed.event';
import { UserChallenge } from '../challenges/entities/user-challenge.entity';
import { Entry } from '../entries/entities/entry.entity';
import { AiInsight } from '../ai/categories/ai-insights/entities/ai-insight.entity';
import { Streak } from '../streaks/entities/streak.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionLog } from '../subscriptions/entities/subscription-log.entity';
import { Task } from '../task/entities/task.entity';
import { FcmDevice } from '../notifications/entities/fcm-device.entity';
import { Mood } from '../moods/entities/mood.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(VerificationCode)
    private codeRepo: Repository<VerificationCode>,
    private configService: ConfigService,
    private tokensService: TokensService,
    private shareService: ShareService,
    private appService: AppService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
    private permissionService: PermissionService,
    private attachmentsService: AttachmentsService,
    @InjectQueue(Constant.MEMBER_QUEUE)
    private parentNotificationQueue: Queue,
    private eventEmitter: EventEmitter2,
    private dataSource: DataSource,
  ) {}

  //register
  async register(
    dto: CreateUserDto,
    i18n?: I18nContext,
    skipSendEmail: boolean = false,
    queryRunner?: QueryRunner,
    guestUser?: User,
  ) {
    if (guestUser) return this._handleLoginByGuestEmail(dto, guestUser);

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (user) {
      return await this._handleLoginByEmail(dto, user, i18n);
    } else {
      return await this._handleRegisterByEmail(dto, skipSendEmail, queryRunner, i18n);
    }
  }

  //Login
  async login(loginUserDto: LoginUserDto): Promise<any> {
    const { email } = loginUserDto;
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    } else {
      if (!user.isGuest) return await this._sendVerifyEmail(user.email, user.type, 'Verify Account', user.debug);
    }
  }

  async _sendVerifyEmail(email: string, userType: UserType, subject: string, debug?: boolean) {
    const verificationCode = await this._generateEmailCode(email, userType);
    const path = `activate?code=${verificationCode.code}`;
    // const dynamicLink = await this._createDynamicLink(verificationCode.code, path);
    const expireInMinutes = moment.duration(Constant.CODE_EXPIRES_IN_MILI).asMinutes();

    await this.mailService.sendMail({
      email: email,
      subject,
      template: 'verify-email',
      context: {
        // link: dynamicLink.shortLink,
        code: verificationCode.code,
        year: `${moment().year()}`,
        expireInMinutes: `${expireInMinutes}`,
      },
    });

    // for testing
    /*if (debug) {
                                                                                                                          const result = {
                                                                                                                            code: verificationCode.code,
                                                                                                                            shortLink: dynamicLink.shortLink,
                                                                                                                          };
                                                                                                                          console.log(result);
                                                                                                                          return result;
                                                                                                                        }*/

    if (process.env.ENV != 'prod' || debug) {
      const result = {
        code: verificationCode.code,
        // shortLink: dynamicLink.shortLink,
      };
      console.log(result);
      return result;
    }
  }

  async _sendMagicLinkEmail(user: User, token: Token, subject: string, template: string) {
    try {
      const magicLink = await this._getMagicLink(token);
      const expireInHours = moment.duration(toMs(Constant.MAGIC_LINK_USER_LOGIN_EXPIRES_IN)).asHours();

      await this.mailService.sendMail({
        email: user.email,
        subject,
        template,
        context: {
          magicLink: magicLink.link,
          year: `${moment().year()}`,
          expireInHours: `${expireInHours}`,
        },
      });
    } catch (e) {
      console.log(e);
    }
  }

  async _getMagicLink(token: Token, metaData?: JSON) {
    const queryParams = metaData ? Utils.jsonToQueryParams(metaData) : null;
    const path = queryParams
      ? `magic-link/login?token=${token.value}&${queryParams}`
      : `magic-link/login?token=${token.value}`;
    return this.shareService.createShareLink(path);
  }

  async _getUserWithTokens(user: User): Promise<User> {
    try {
      const payload = { id: user.id };

      const nowTime = new Date().getTime();
      const accessExpireAt = new Date(nowTime + toMs(Constant.ACCESS_EXPIRES_IN));
      const accessToken = await this.tokensService.generateToken(payload, Constant.ACCESS_EXPIRES_IN);
      const refresh = await this.tokensService.generateToken(payload, Constant.REFRESH_EXPIRES_IN);
      const refreshExpireAt = new Date(nowTime + toMs(Constant.REFRESH_EXPIRES_IN));

      user.access = accessToken.value;
      user.accessExpireAt = accessExpireAt;
      user.refresh = refresh.value;
      user.refreshExpireAt = refreshExpireAt;
      return user;
    } catch (e) {
      throw new NotFoundException(new AppError(ERR_GENERATE_TOKEN));
    }
  }

  async findOne(id: string): Promise<User> {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profileImageAttachment', 'profileImageAttachment')
      .leftJoinAndSelect('user.fcmSubscribedTopics', 'fcmSubscribedTopics')
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .where('user.id=:id', { id })
      .addSelect(['user.permissions'])
      .getOne();
  }

  /* async _createExploreAppNotification(user: User, i18n: I18nContext) {
    const notificationDto = this._getRegisterNotificationByUserType(user.type, i18n);
    if (notificationDto) {
      await this.notificationsService.createUserNotification(user.id, notificationDto);
    }
  }*/

  async findOneOrFail(id: string, error?: Record<string, any>): Promise<User> {
    const found = await this.findOne(id);
    if (!found) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER, error));
    }
    return found;
  }

  /* async _createExploreAppNotification(user: User, i18n: I18nContext) {
    const notificationDto = this._getRegisterNotificationByUserType(user.type, i18n);
    if (notificationDto) {
      await this.notificationsService.createUserNotification(user.id, notificationDto);
    }
  }*/

  async findOneByEmail(email: string, withDeleted = false): Promise<User> {
    const query = this.userRepo.createQueryBuilder('user');
    query
      .leftJoinAndSelect('user.profileImageAttachment', 'profileImageAttachment')
      .leftJoinAndSelect('user.fcmSubscribedTopics', 'fcmSubscribedTopics')
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .where('user.email=:email', { email })
      .addSelect(['user.permissions']);

    const user = withDeleted ? await query.withDeleted().getOne() : await query.getOne();

    return user;
  }

  async findOneByAppleIdOrEmail(appleId: string, email?: string): Promise<User> {
    const query = this.userRepo.createQueryBuilder('user');
    query
      .leftJoinAndSelect('user.profileImageAttachment', 'profileImageAttachment')
      .leftJoinAndSelect('user.fcmSubscribedTopics', 'fcmSubscribedTopics');
    query.where('user.appleId=:appleId', { appleId });
    if (email) query.orWhere('user.email=:email', { email });
    return query.addSelect(['user.permissions']).withDeleted().getOne();
  }

  async findOneByEmailOrFail(email: string): Promise<User> {
    const found = await this.findOneByEmail(email);
    if (!found) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    }
    return found;
  }

  async update(user: User, dto: UpdateUserDto): Promise<User> {
    let {
      fullName,
      address,
      profileImageAttachment,
      countryCode,
      languageCode,
      contentLanguageCode,
      extraData,
      isFirstLogin,
      onBoardingStep,
      timezone,
      lastLoginAt,
      birthdayAt,
      appVersion,
      allowUpdateMailing,
      isTeamMember,
      onboardingVersion,
      onboardingData,
    } = dto;
    if (profileImageAttachment) {
      profileImageAttachment = await this._checkAttachmentExist(profileImageAttachment);
    }

    const utcOffset = getUtcOffsetByTimezone(timezone);
    const allowReturnTokens = !dto.userId;
    const userId = dto.userId ?? user.id;
    const result = await this.userRepo.update(userId, {
      fullName,
      address,
      profileImageAttachment,
      countryCode,
      languageCode,
      contentLanguageCode,
      extraData,
      isFirstLogin,
      onBoardingStep,
      timezone,
      utcOffset,
      lastLoginAt,
      birthdayAt,
      appVersion,
      isTeamMember,
      onboardingVersion,
      onboardingData,
    });

    if (result.affected && result.affected > 0) {
      const found = await this.findOneOrFail(userId, { source: 'update' });
      if (allowUpdateMailing) this.eventEmitter.emit('user.updated', found.id, 'reason update API');
      return allowReturnTokens ? this._getUserWithTokens(found) : found;
    } else {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER, { source: 'update' }));
    }
  }

  async findAll() {
    return `This action returns all user`;
  }

  async guest(createGuestDto: CreateGuestDto, i18n: I18nContext, queryRunner?: QueryRunner) {
    const guestEmail = `guest-${uuid()}@${Constant.GUEST_EMAIL_DOMAIN}`;
    createGuestDto.guestEmail = guestEmail;
    createGuestDto.email ??= guestEmail;
    createGuestDto.isGuest = true;
    const dto = new CreateUserDto(createGuestDto);
    return await this._handleRegisterByEmail(dto, true, queryRunner, i18n);
  }

  async remove(data: { id: string; deleteUser?: User }, archive: boolean = false) {
    const { id, deleteUser } = data;
    const user = deleteUser ?? (await this.userRepo.findOne({ where: { id } }));
    if (!user) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    return archive ? this.userRepo.softRemove(user) : this.userRepo.remove(user);
  }

  async getUserByToken(token: string): Promise<User> {
    const userId = await this.tokensService.validateToken(token);

    if (userId) {
      return await this.findOneOrFail(userId, { source: 'getUserByToken' });
    } else {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER, { source: 'getUserByToken' }));
    }
  }

  async refreshToken(refresh: string): Promise<User> {
    const user = await this.getUserByToken(refresh);
    return this._getUserWithTokens(user);
  }

  async socialLogin(dto: SocialLoginDto, i18n: I18nContext, user?: User) {
    const guestUser = user?.isGuest ? user : null;
    // const { token, providerType, userType, appleAuthorizationCode, languageCode, contentLanguageCode } = socialLoginDto;
    switch (dto.providerType) {
      case RegisterProviderType.GOOGLE:
        return this._googleLogin(dto, i18n, guestUser);
      case RegisterProviderType.FACEBOOK:
        return this._facebookLogin(dto, i18n, guestUser);
      case RegisterProviderType.APPLE:
        return this._appleLogin(dto, i18n, guestUser);
    }
  }

  async _appleLogin(socialLoginDto: SocialLoginDto, i18n: I18nContext, guestUser?: User) {
    const { appleAuthorizationCode, userType, useBundleId, fullName, languageCode, contentLanguageCode, timezone } =
      socialLoginDto;

    const payload = (await this._getAppleSignInPayload(appleAuthorizationCode, useBundleId)) as jwt.JwtPayload;

    // const payload = jwt.decode(token) as jwt.JwtPayload;
    const appleId = payload['sub'];
    const email = payload['email'];
    // because in apple frontend if you select hide my personal info
    // the email will be some random@id.apple.com and is_private_email in payload will be a string 'true'
    // and maybe the user can login 2nd time with hide my email unselected
    const isApplePrivateEmail = payload['is_private_email'] == true;

    let user = guestUser ?? (await this.findOneByAppleIdOrEmail(appleId, email));
    if (!user && !userType) {
      // mean registration without userType
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    }

    const dto = new CreateUserDto({
      email,
      userType,
      fullName,
      registerProviderType: RegisterProviderType.APPLE,
      appleId,
      isApplePrivateEmail,
      languageCode,
      contentLanguageCode,
      timezone,
      isGuest: false,
    });

    if (!user) {
      user = await this._createUser(dto, true, i18n);
    } else {
      user = await this._checkAndReplaceEmptyUserParams(user, dto);
    }

    return this._getUserWithTokens(user);
  }

  _generateEmailCode(email, userType): Promise<VerificationCode> {
    const code = Constant.randomCodeString(6);
    const expireAt = new Date(new Date().getTime() + Constant.CODE_EXPIRES_IN_MILI);
    const verificationCode = this.codeRepo.create({
      code: code,
      email: email,
      userType: userType,
      expireAt: expireAt,
    });
    return this.codeRepo.save(verificationCode);
  }

  async verifyEmail(code: string) {
    const found = await this._checkCodeValidationOrFail(code);
    //const dto = new CreateUserDto(found.email, found.userType);
    let user = await this.findOneByEmailOrFail(found.email);
    const now = new Date();
    user.firstLoginAt ??= now;
    user.lastLoginAt = now;
    user.activated = true;
    user.isFirstLogin = false;
    user.isGuest = false;
    const saved = await this.userRepo.save(user);
    return this._getUserWithTokens(saved);
  }

  async me(user: User): Promise<User> {
    const found = await this.findOneOrFail(user.id, { source: 'me' });
    // to get all relations
    await this.userRepo.update(found.id, { lastLoginAt: new Date() });
    this.eventEmitter.emit('user.updated', user.id, 'reason me API');
    return this._getUserWithTokens(found);
  }

  async phoneNumberLogin(phoneNumberLoginDto: PhoneNumberLoginDto, i18n: I18nContext) {
    const { phoneNumber, userType, type } = phoneNumberLoginDto;

    const dto = new CreateUserDto({
      userType,
      registerProviderType: type,
      phoneNumber,
      isGuest: false,
    });
    let user = await this.userRepo.findOne({
      where: { phoneNumber: phoneNumber },
    });
    if (!user) {
      user = await this._createUser(dto, true, i18n);
      await this._checkAndReplaceEmptyUserParams(user, dto);
    } else {
      throw new ConflictException(new AppError(ERR_USER_ALREADY_EXIST));
    }
    return this._getUserWithTokens(user);
  }

  async registerSuperUser(dto: CreateSuperUserDto): Promise<User> {
    let user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (user) throw new ConflictException(new AppError(ERR_EMAIL_ALREADY_EXIST));
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      type: dto.userType,
      permissions: Permission.SUPER_USER_DEFAULT_PERMISSIONS,
      registerProviderType: RegisterProviderType.EMAIL,
      activated: true,
      isFirstLogin: true,
    });
    let savedUser = await this.userRepo.save(user);
    return this._getUserWithTokens(savedUser);
  }

  async loginSuperUser(dto: LoginSuperUserDto): Promise<User> {
    const user = await this.findOneByEmailOrFail(dto.email);
    if (!user) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    // this._isSuperUser(user);
    if (user && (await bcrypt.compare(dto.password, user.password))) return this._getUserWithTokens(user);
    else throw new ConflictException(new AppError(ERR_EMAIL_OR_PASSWORD_IS_INCORRECT));
  }

  async sendSuperUserResetEmail(email: string) {
    const user = await this.userRepo.findOne({ where: { email: email } });
    if (!user) throw new NotFoundException(new AppError(ERR_EMAIL_NOT_FOUND));
    this._isSuperUser(user);
    return this._sendVerifyEmail(email, UserType.SUPER_USER, 'Reset Email Password');
  }

  async resetSuperUserPassword(dto: ResetSuperUserPasswordDto): Promise<User> {
    const { newPassword, code } = dto;
    const verificationCode = await this._checkCodeValidationOrFail(code);
    let user = await this.findOneByEmailOrFail(verificationCode.email);
    this._isSuperUser(user);
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.userRepo.update(user.id, { password: hashedPassword });
    this.eventEmitter.emit('user.updated', user.id, 'reason resetSuperUserPassword API');
    return this._getUserWithTokens(user);
  }

  async addPermissions(dto: CUPermissionUserDto) {
    const permissionsString = dto.permissions.join(',');
    const query = this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        permissions: () => `CASE
          WHEN LENGTH(permissions) > 0 THEN CONCAT(permissions, ',${permissionsString}')
          ELSE '${permissionsString}'
          END
          `,
      });
    if (dto.userId) query.andWhere('id=:id', { id: dto.userId });
    if (dto.userType) query.andWhere('type=:type', { type: dto.userType });
    if (dto.emails) query.andWhere('email IN (:...emails)', { emails: dto.emails });
    const result = await query.execute();
    console.log(`result.affected=${result.affected}`);
  }

  async updatePermissions(dto: CUPermissionUserDto) {
    if (dto.permissions) {
      const permissionsString = dto.permissions.join(',');
      const query = this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({})
        .set({
          permissions: () => `'${permissionsString}'`,
        });
      if (dto.userId) query.andWhere('id=:id', { id: dto.userId });
      if (dto.userType) query.andWhere('type=:type', { type: dto.userType });
      const result = await query.execute();
      console.log(`result.affected=${result.affected}`);
      if (result.affected === 0) {
        throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
      }
    }
  }

  async registerBusiness(dto: CreateBusinessUserDto, user: User) {
    const { userType } = dto;
    const allowedUserTypes = [UserType.ORGANIZATION, UserType.REFERRAL];
    if (!allowedUserTypes.includes(userType)) {
      throw new UnauthorizedException(
        new AppError(ERR_PERMISSIONS_UNAUTHORIZED, {
          allowedUserTypes: allowedUserTypes,
        }),
      );
    }
    return this.registerSuperUser(dto);
  }

  callbackSignInWithApple(body: any, res: any) {
    const queryParams = Utils.jsonToQueryParams(body);
    const redirectUrl = `intent://callback?${queryParams}#Intent;package=${Constant.ANDROID_PACKAGE_NAME};scheme=signinwithapple;end`;
    console.log(`redirectUrl=${redirectUrl}`);
    return res.redirect(redirectUrl);
  }

  async createMany(dtos: CreateUserDto[], createdBy: User, parentNodeId?: string) {
    // check for users what type of userType can create in bulk
    const allowedUserTypes = this._checkAllowedCreateUserTypePermissions(createdBy);

    // -------------------------------
    const parentNode = parentNodeId ? await this.findOne(parentNodeId) : createdBy;

    const users: User[] = [];
    const emails: string[] = [];

    for (const dto of dtos) {
      const { fullName, email, userType, profileImageAttachment } = dto;
      if (!allowedUserTypes.includes(userType)) continue;
      const isTeamMember = this._isTeamMemberByUserType(userType);

      const user = this.userRepo.create({
        fullName: fullName,
        email: email,
        type: userType,
        registerProviderType: RegisterProviderType.EMAIL,
        activated: true,
        profileImageAttachment: profileImageAttachment,
        nodeTree: this._getChildNodeTree(parentNode),
        parentNode,
        isTeamMember,
      });
      const permissions = this._getPermissionByUserType(userType);
      if (permissions) user.permissions = permissions;
      users.push(user);
      emails.push(email);
    }

    const emailsExist = (await this.userRepo.find({ where: { email: In(emails) } })).map((value) =>
      value.email.toLowerCase(),
    );
    const newUsers = users.filter((user) => !emailsExist.includes(user.email.toLowerCase()));
    const savedUsers = await this.userRepo.save(newUsers);
    const payloads = savedUsers.map((user) => {
      // return { id: user.id };
      let payload: MagicLinkPayload = {
        id: user.id,
        generatedById: createdBy.id,
      };
      return payload;
    });
    const tokens = await this.tokensService.generateTokens(payloads, Constant.MAGIC_LINK_USER_LOGIN_EXPIRES_IN, 1);

    savedUsers.forEach((user) => {
      const foundedToken = tokens.find((token) => {
        return this.tokensService.decodeToken(token.value).id === user.id;
      });

      this._sendMagicLinkEmail(user, foundedToken, 'Welcome to SenLife', 'magic-link-login');
    });

    return savedUsers;
  }

  async verifyMagicLink(dto: VerifyMagicLinkDto, i18n: I18nContext) {
    const { token } = dto;
    const foundedToken = await this.tokensService.findOneByValue(token);
    if (foundedToken.consumed) throw new ConflictException(new AppError(ERR_TOKEN_ALREADY_USED));
    const { id: userId, generatedById } = await this.tokensService.validatePayloadToken(token, true);
    await this.userRepo.update(
      { id: userId },
      {
        firstLoginAt: () => 'IFNULL(firstLoginAt, NOW())',
        isFirstLogin: () => `CASE 
                WHEN activated = true THEN false 
                ELSE true 
              END`,
      },
    );
    const user = await this.findOne(userId);
    this.eventEmitter.emit('user.updated', user.id, 'reason verifyMagicLink API');
    this._notifyGeneratedById(generatedById, user, i18n);
    return this._getUserWithTokens(user);
  }

  async generateMagicLink(dto: GenerateMagicLinkDto, parentNode: User) {
    const { userId, metaData } = dto;
    const childNode = await this.findOneOrFail(userId);

    // check if parentNode can manage childNode
    await this.permissionService.checkCanManageNodeUserOrFail(parentNode, childNode, [
      UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS,
    ]);

    let payload: MagicLinkPayload = {
      id: userId,
      generatedById: parentNode.id,
    };

    const token = await this.tokensService.generateToken(payload, Constant.MAGIC_LINK_USER_LOGIN_EXPIRES_IN, 1, true);
    return this._getMagicLink(token, metaData);
  }

  async magicLogin(dto: MagicLoginDto, parentNode: User) {
    const childNode = await this.findOneOrFail(dto.userId);

    // check if parentNode can manage childNode
    await this.permissionService.checkCanManageNodeUserOrFail(parentNode, childNode, [
      UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS,
    ]);

    const now = new Date();
    childNode.firstLoginAt ??= now;
    childNode.lastLoginAt = now;
    childNode.activated = true;
    const saved = await this.userRepo.save(childNode);
    return this._getUserWithTokens(saved);
  }

  async checkCanManageNode(parentNode: User, childNodeId: string, requiredPermissions: UserPermissionsType[]) {
    const childNode = await this.findOneOrFail(childNodeId);

    // check if parentNode can manage childNode
    await this.permissionService.checkCanManageNodeUserOrFail(parentNode, childNode, requiredPermissions);
  }

  async sendMagicLink(dtos: SendMagicLinkDto[], parentNode: User) {
    const userIds = dtos.map((value) => value.id);
    const childNodes = await this.userRepo.find({
      where: { id: In(userIds) },
    });
    // filter manageable node users from foundedUsers
    const manageableChildNodes = await this.permissionService.getManageableNodeUsers(parentNode, childNodes, [
      UserPermissionsType.CAN_OTHER_VIEW_MY_DESCENDANTS,
    ]);
    const tokens = await this._getTokens(manageableChildNodes);
    await this._sendMagicLinkToBulkUsers(manageableChildNodes, tokens);
  }

  async findAllNodes(nodeUserId: string, dto: FilterNodeDto): Promise<Pagination<User>> {
    const nodeUser = await this.userRepo.findOneOrFail({
      where: { id: nodeUserId },
    });
    let { userTypes, exactDepth, depth, include, take, skip, search, orderBy, sortType, forceBusinessUsersOnly } = dto;
    const query = this.userRepo.createQueryBuilder('user');

    const nodeRegex = Utils.getFormattedDepthStringByNode(nodeUser, depth, exactDepth);

    // make the regex check only if the nodeUser is not SenLife
    if (forceBusinessUsersOnly || !nodeUser.isRoot) {
      query.where(`user.nodeTree IS NOT NULL AND user.nodeTree REGEXP :nodeRegex`, {
        nodeRegex: `${nodeRegex}`,
      });
    }

    if (userTypes && !isEmpty(userTypes)) {
      query.andWhere('user.type IN (:...types)', {
        types: userTypes,
      });
    }

    //
    if (search) {
      query.andWhere('(LOWER(user.fullName) LIKE LOWER(:search)' + 'OR LOWER(user.email) LIKE LOWER(:search) )', {
        search: `%${search}%`,
      });
    }
    if (orderBy) {
      this.nodeOrderBy(orderBy, query, sortType);
    }
    query.leftJoinAndSelect('user.profileImageAttachment', 'profileImageAttachment');

    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<User>(data, total);
  }

  async findParentNode(nodeUserId: string): Promise<User> {
    const nodeUser = await this.userRepo.findOneOrFail({
      where: { id: nodeUserId },
    });

    throw new NotFoundException();

    return this.findOneOrFail(nodeUser.parentId);
  }

  async findAllAncestorsNodes(nodeUserId: string): Promise<User[]> {
    return this.permissionService.findAllAncestorsNodes(nodeUserId);
  }

  async findTopLevelParentNode(nodeUserId: string, dto: ParentNodeDto) {
    const { requiredPermissions, userType } = dto;
    const ancestorUsers = await this.permissionService.findAllAncestorsNodes(nodeUserId);
    const topLevelNode = this.permissionService.getTopLevelNodeByPermission(
      ancestorUsers,
      requiredPermissions,
      userType,
    );

    if (!topLevelNode) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    }
    return topLevelNode;
  }

  async setToDefaultPermissions(dto: SetToDefaultPermissionUserDto) {
    if (dto.userId) {
      const user = await this.findOne(dto.userId);
      const defaultPermissions = this._getPermissionByUserType(user?.type);
      await this.updatePermissions({
        permissions: defaultPermissions,
        userId: dto.userId,
      });
    }
    if (dto.userType) {
      const defaultPermissions = this._getPermissionByUserType(dto.userType);
      await this.updatePermissions({
        permissions: defaultPermissions,
        userType: dto.userType,
      });
    }
    if (dto.userIds) {
      await this._setPermissionsByIds(dto.userIds);
    }

    if (dto.emails) {
      await this._setPermissionsByEmails(dto.emails);
    }
  }

  async updateVip(id: string, dto: UpdateUserVipDto, user: User) {
    const result = await this.userRepo.update(id, { isVip: dto.isVip });
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    }

    this.eventEmitter.emit('user.updated', id, 'reason updateVip API');
    this.eventEmitter.emit('subscription.changed', {
      userId: id,
    } as SubscriptionChangedEvent);

    return this.findOne(id);
  }

  async restUserRegister(user: User, i18n: I18nContext) {
    await this.parentNotificationQueue.removeJobs(`*${user.id}*`);
    console.log(`user ${user.email} all jobs removed`);
    // if (user.type == UserType.MEMBER) {
    //   return this._schedulePushNotificationAfter30min(user, i18n);
    // }
  }

  _copyUserParams(data: { user: User; userCopiedFrom: User }): User {
    const { user, userCopiedFrom } = data;
    user.email = userCopiedFrom.email;
    user.fullName = userCopiedFrom.fullName;
    return user;
  }

  private async _handleLoginByGuestEmail(dto: CreateUserDto, guestUser: User) {
    const user = await this._checkAndReplaceEmptyUserParams(guestUser, dto);
    return this._getUserWithTokens(user);
  }

  private async _createUser(
    dto: CreateUserDto,
    activated = false,
    i18n?: I18nContext,
    queryRunner?: QueryRunner,
  ): Promise<User> {
    let {
      email,
      fullName,
      address,
      userType,
      profileImageAttachment,
      registerProviderType,
      isDemo,
      isDeveloper,
      appleId,
      isApplePrivateEmail,
      countryCode,
      languageCode,
      contentLanguageCode,
      onBoardingStep,
      extraData,
      timezone,
      appVersion,
      isGuest,
      guestEmail,
      onboardingVersion,
      onboardingData,
    } = dto;
    if (profileImageAttachment)
      profileImageAttachment = await this.attachmentsService.checkAttachmentExistOrFail(profileImageAttachment.id);
    else {
      profileImageAttachment = await this._getRandomAvatar();
    }
    const foundedUserCountry = userCountry?.find((value) => value.code === countryCode);
    const utcOffset = getUtcOffsetByTimezone(timezone);
    const now = new Date();

    const user = this.userRepo.create({
      email,
      fullName: fullName,
      address: address,
      type: userType,
      activated,
      registerProviderType,
      appleId,
      isApplePrivateEmail,
      profileImageAttachment: profileImageAttachment,
      isDemo: isDemo,
      languageCode,
      contentLanguageCode,
      isDeveloper: isDeveloper,
      countryCode: countryCode,
      countryName: foundedUserCountry?.name,
      firstLoginAt: now,
      lastLoginAt: now,
      extraData,
      isFirstLogin: true,
      onBoardingStep,
      timezone,
      utcOffset,
      appVersion,
      isGuest,
      guestEmail: guestEmail,
      onboardingVersion,
      onboardingData,
    });
    /////////////////////
    const permissions = this._getPermissionByUserType(userType);
    if (permissions) user.permissions = permissions;
    /////////////////////
    const saved = queryRunner ? await queryRunner.manager.save(user) : await this.userRepo.save(user);

    this.eventEmitter.emit('user.created', saved);

    // this._createExploreAppNotification(saved, i18n);
    return saved;
  }

  private async _saveSocialAttachment(platform: RegisterProviderType, url?: string): Promise<Attachment> {
    if (url) {
      const prefixName = this._getImagePrefixNameByPlatform(platform);
      const name = `${prefixName}-${uuid()}`;
      const attachment = this.attachmentRepo.create({
        url,
        name,
        type: AttachmentType.IMAGE,
      });
      return this.attachmentRepo.save(attachment);
    } else {
      return undefined;
    }
  }

  private _getImagePrefixNameByPlatform(platform: RegisterProviderType): string {
    switch (platform) {
      case RegisterProviderType.GOOGLE:
        return 'google-image';
      case RegisterProviderType.FACEBOOK:
        return 'fb-image';
      default:
        return 'social-image';
    }
  }

  private async _checkAttachmentExist(attachment): Promise<Attachment> {
    const foundedAttachment = await this.attachmentRepo.findOne({
      where: { id: attachment.id },
    });
    if (!foundedAttachment) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ATTACHMENT));
    } else {
      return foundedAttachment;
    }
  }

  private async _facebookLogin(socialLoginDto: SocialLoginDto, i18n: I18nContext, guestUser?: User) {
    const { userType, token, fullName, languageCode, contentLanguageCode, timezone } = socialLoginDto;
    const facebookFields = Constant.FACEBOOK_FIELDS;
    const url = Constant.FACEBOOK_URL(facebookFields, token);
    let data;
    try {
      const response = await axios.post(url);
      data = response.data;
    } catch (e) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    }

    let user = guestUser ?? (await this.findOneByEmail(data.email));
    if (!user && !userType) {
      // mean registration without userType
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));
    }
    // save social attachment
    const attachment = await this._saveSocialAttachment(RegisterProviderType.FACEBOOK, data.picture?.data?.url);

    const space = data.first_name && data.last_name ? ' ' : '';
    const dto = new CreateUserDto({
      email: data.email,
      userType,
      languageCode,
      fullName: `${data.first_name ?? ''}${space}${data.last_name ?? ''}`,
      profileImageAttachment: attachment,
      registerProviderType: RegisterProviderType.FACEBOOK,
      timezone,
      isGuest: false,
    });

    if (!user) {
      user = await this._createUser(dto, true, i18n);
    } else {
      user = await this._checkAndReplaceEmptyUserParams(user, dto);
    }
    return this._getUserWithTokens(user);
  }

  private async _getAppleSignInPayload(appleAuthorizationCode: string, useBundleId: boolean) {
    // CLIENT ID
    const clientId = useBundleId ? Constant.IOS_BUNDLE_ID : this.configService.get('APPLE_CLIENT_ID');

    const privateKeyPath = path.join(__dirname, 'keys/AuthKey_2DJ77U8N2X.p8');
    const keyIdentifier = this.configService.get('APPLE_KEY_ID');
    const teamId = this.configService.get('APPLE_TEAM_ID');

    try {
      const clientSecret = appleSignIn.getClientSecret({
        clientID: clientId,
        teamId,
        keyIdentifier,
        privateKeyPath,
      });

      const response = await axios.post('https://appleid.apple.com/auth/token', null, {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: appleAuthorizationCode,
          /*redirect_uri:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          'https://senlife-75f30.firebaseapp.com/__/auth/handler',*/
        },
      });
      const tokens = response.data;

      if (!tokens.id_token) throw new ForbiddenException();

      return jwt.decode(tokens.id_token);
    } catch (e) {
      console.log(e);
      throw new NotFoundException(new AppError(ERR_APPLE_API));
      // rethrow(e);
    }
  }

  private async _checkAndReplaceEmptyUserParams(user: User, dto: CreateUserDto): Promise<User> {
    user.fullName ??= dto.fullName;

    // change user email only if use had a private email and new email exist
    if (user.isApplePrivateEmail && dto.email) user.email = dto.email;

    if (dto.profileImageAttachment) {
      user.profileImageAttachment ??= await this._checkAttachmentExist(dto.profileImageAttachment);
    }
    // check if user has email then show error
    if (!user.email) throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER));

    user.isApplePrivateEmail = dto.isApplePrivateEmail;
    user.registerProviderType ??= dto.registerProviderType;
    user.phoneNumber ??= dto.phoneNumber;
    user.firstLoginAt ??= new Date();
    user.isFirstLogin = false;
    user.deletedAt = null;
    if (user.isGuest && dto.email) await this._handleMergeGuestUser(user, dto);

    if (dto.languageCode) user.languageCode = dto.languageCode;
    if (dto.contentLanguageCode) user.contentLanguageCode = dto.contentLanguageCode;

    return this.userRepo.save(user);
  }

  private async _handleMergeGuestUser(user: User, dto: CreateUserDto) {
    const isAppleLogin = dto.registerProviderType == RegisterProviderType.APPLE;
    const existingUser = isAppleLogin
      ? await this.findOneByAppleIdOrEmail(dto.appleId, dto.email)
      : await this.userRepo.findOne({ where: { email: dto.email } });

    if (existingUser) {
      switch (Constant.GUEST_REGISTER_OLD_USER_MERGE_TYPE) {
        case DataMergeTypeEnum.ERR_ALREADY_EXIST:
          throw new ConflictException(new AppError(ERR_ACCOUNT_WITH_EMAIL_ALREADY_REGISTERED));
        case DataMergeTypeEnum.KEEP_OLD:
          await this.remove({ id: user.id, deleteUser: user }, false);
          user = existingUser;
          break;
        case DataMergeTypeEnum.KEEP_NEW:
          this._copyUserParams({ user, userCopiedFrom: existingUser });
          await this.remove({ id: existingUser.id, deleteUser: existingUser }, false);
          break;
        case DataMergeTypeEnum.MERGE:
          await this._mergeGuestAndOldUser(user, existingUser);
          break;
      }
    }

    user.email = dto.email;
    user.isGuest = false;
    user.guestEmail = null;
  }

  private async _googleLogin(socialLoginDto: SocialLoginDto, i18n: I18nContext, guestUser?: User) {
    const { userType, token, fullName, languageCode, contentLanguageCode, timezone } = socialLoginDto;
    const url = Constant.GOOGLE_URL(token);
    let data;
    try {
      const response = await axios.post(url);
      data = response.data;
    } catch (e) {
      throw new NotFoundException(new AppError(ERR_GOOGLE_API));
    }

    let user = guestUser ?? (await this.findOneByEmail(data.email, true));
    if (!user && !userType) {
      // mean registration without userType
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_USER, { source: 'findOneByEmail' }));
    }

    // save social attachment
    const attachment = await this._saveSocialAttachment(RegisterProviderType.GOOGLE, data.picture);

    const space = data.given_name && data.family_name ? ' ' : '';
    const dto = new CreateUserDto({
      email: data.email,
      userType,
      languageCode,
      contentLanguageCode,
      profileImageAttachment: attachment,
      registerProviderType: RegisterProviderType.GOOGLE,
      fullName: `${data.given_name ?? ''}${space}${data.family_name ?? ''}`,
      timezone,
      isGuest: false,
    });
    if (!user) {
      user = await this._createUser(dto, true, i18n);
    } else {
      user = await this._checkAndReplaceEmptyUserParams(user, dto);
    }

    return this._getUserWithTokens(user);
  }

  private async _createDynamicLink(code: string, path: string): Promise<{ shortLink: string; code: string }> {
    const firebaseAPIKey = await this.configService.get('FIREBASE_WEB_API_KEY');
    const dynamicLinkBaseUrl = this.configService.get('DYNAMIC_LINK_BASE_URL');
    const response = await axios({
      method: 'POST',
      url: Constant.FIREBASE_URL(firebaseAPIKey),
      data: {
        dynamicLinkInfo: {
          domainUriPrefix: Constant.DYNAMIC_LINK_DOMAIN_URI_PREFIX,
          link: Constant.FIREBASE_DYNAMIC_LINK(path, dynamicLinkBaseUrl),
          androidInfo: {
            androidPackageName: Constant.ANDROID_PACKAGE_NAME,
          },
          iosInfo: {
            iosBundleId: Constant.IOS_BUNDLE_ID,
            iosAppStoreId: Constant.IOS_APP_STORE_ID,
          },
        },
      },
    }).catch(() => {
      throw new ForbiddenException(ERR_GENERATE_FIREBASE_DYNAMIC_LINK);
    });
    const shortLink = response.data.shortLink;
    return { shortLink, code };
  }

  private async _checkCodeValidationOrFail(code: string): Promise<VerificationCode> {
    const now = new Date();
    const found = await this.codeRepo.findOne({
      where: { code: code },
    });
    if (!found) {
      throw new ConflictException(new AppError(ERR_INCORRECT_CODE));
    } else if (found.expireAt < now) {
      await this.codeRepo.delete({ id: found.id });
      throw new NotFoundException(new AppError(ERR_EXPIRED_CODE));
    }
    await this._consumeVerificationCode(found);
    return found;
  }

  /*private _getRegisterNotificationByUserType(type: UserType, i18n: I18nContext): PushNotificationDto {
    let dto: PushNotificationDto;
    switch (type) {
      case UserType.MEMBER:
        dto = {
          notification: {
            title: i18n.t('locale.notification_title_explore_app_as_parent'),
            body: i18n.t('locale.notification_body_explore_app'),
          },
          type: NotificationType.EXPORE_APP_AS_PARENT,
        };
        return dto;
      case UserType.DOCTOR:
        dto = {
          notification: {
            title: i18n.t('locale.notification_title_explore_app_as_teacher_partner'),
            body: i18n.t('locale.notification_body_explore_app'),
          },
          type: NotificationType.EXPORE_APP_AS_DOCTOR,
        };
        return dto;
      case UserType.PARTNER:
        dto = {
          notification: {
            title: i18n.t('locale.notification_title_explore_app_as_partner'),
            body: i18n.t('locale.notification_body_explore_app'),
          },
          type: NotificationType.EXPORE_APP_AS_POST,
        };
        return dto;
      case UserType.SUPER_USER:
      case UserType.ORGANIZATION:
      case UserType.REFERRAL:
        return null;
    }
  }*/

  private _consumeVerificationCode(verificationCode: VerificationCode): Promise<VerificationCode> {
    if (verificationCode.consumed) {
      throw new NotFoundException(new AppError(ERR_CODE_ALREADY_USED));
    }
    verificationCode.consumedTimes++;
    return this.codeRepo.save(verificationCode);
  }

  private _isSuperUser(user: User) {
    if (user.type !== UserType.SUPER_USER) throw new UnauthorizedException(new AppError(ERR_UNAUTHORIZED));
  }

  private _getPermissionByUserType(userType: UserType): UserPermissionsType[] {
    const defaultPermissions = {
      SUPER_USER: Permission.SUPER_USER_DEFAULT_PERMISSIONS,
      APP_ORGANIZATION: Permission.APP_ORGANIZATION_DEFAULT_PERMISSIONS,
      APP_MANAGER: Permission.APP_MANAGER_DEFAULT_PERMISSIONS,
      APP_WORKER: Permission.APP_WORKER_DEFAULT_PERMISSIONS,
      ORGANIZATION: Permission.ORGANIZATION_DEFAULT_PERMISSIONS,
      MANAGER: Permission.MANAGER_DEFAULT_PERMISSIONS,
      WORKER: Permission.WORKER_DEFAULT_PERMISSIONS,
      DOCTOR: Permission.DOCTOR_DEFAULT_PERMISSIONS,
      MEMBER: Permission.MEMBER_DEFAULT_PERMISSIONS,
      POST: Permission.POST_DEFAULT_PERMISSIONS,
      REFERRAL: [],
      EXPERT: [],
    };

    return defaultPermissions[userType];
  }

  private async _sendMagicLinkToBulkUsers(users: User[], tokens: Token[]) {
    users.forEach((user) => {
      const foundedToken = tokens.find((token) => {
        return this.tokensService.decodeToken(token.value).id === user.id;
      });
      this._sendMagicLinkEmail(user, foundedToken, 'Account Login', 'magic-link-login');
    });
  }

  private async _getTokens(users: User[]) {
    const payloads = users.map((user) => {
      return { id: user.id };
    });
    return await this.tokensService.generateTokens(payloads, Constant.MAGIC_LINK_USER_LOGIN_EXPIRES_IN, 1);
  }

  private _checkAllowedCreateUserTypePermissions(createdBy: User): UserType[] {
    let allowedUserTypes: UserType[] = [];
    const permissionUserTypes = {
      CAN_CREATE_APP_ORGANIZATION: UserType.APP_ORGANIZATION,
      CAN_CREATE_APP_MANAGER: UserType.APP_MANAGER,
      CAN_CREATE_APP_WORKER: UserType.APP_WORKER,
      CAN_CREATE_ORGANIZATION: UserType.ORGANIZATION,
      CAN_CREATE_MANAGER: UserType.MANAGER,
      CAN_CREATE_WORKER: UserType.WORKER,
      CAN_CREATE_PARENT: UserType.MEMBER,
      CAN_CREATE_POST: UserType.PARTNER,
      CAN_CREATE_DOCTOR: UserType.DOCTOR,
    };

    createdBy.permissions?.forEach((permission) => {
      const allowed: UserType = permissionUserTypes[permission];
      if (allowed) {
        allowedUserTypes.push(allowed);
      }
    });

    return allowedUserTypes;
  }

  private _getChildNodeTree(user: User): string {
    if (user.nodeTree == null) return null;
    return `${user.nodeTree}${user.id}/`;
  }

  private nodeOrderBy(nodeOrderBy: NodeOrderBy, query: SelectQueryBuilder<User>, sortType: SortType) {
    switch (nodeOrderBy) {
      case NodeOrderBy.UPDATED_AT:
        query.orderBy('user.updatedAt', sortType);
        break;
      case NodeOrderBy.CREATED_AT:
        query.orderBy('user.createdAt', sortType);
        break;
      case NodeOrderBy.NAME:
        query.orderBy('user.fullName', sortType);
        break;
    }
  }

  private _getPermissionsStringByUserType(userType: UserType) {
    return this._getPermissionByUserType(userType).join(',');
  }

  private _setPermissions() {
    let cases = '';
    const userTypes = values(UserType);
    for (const type of userTypes) {
      const permissions = this._getPermissionsStringByUserType(type);
      cases += `WHEN type = '${type}' THEN '${permissions}'`;
    }

    return `CASE
        ${cases}
        ELSE permissions
        END
        `;
  }

  private async _setPermissionsByIds(ids: string[]) {
    const query = this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        permissions: () => this._setPermissions(),
      })
      .andWhere('id IN (:...ids)', { ids: ids });
    const result = await query.execute();
    console.log(`result.affected=${result.affected}`);
  }

  private async _setPermissionsByEmails(emails: string[]) {
    const query = this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        permissions: () => this._setPermissions(),
      })
      .andWhere('email IN (:...emails)', { emails: emails });
    const result = await query.execute();
    console.log(`result.affected=${result.affected}`);
  }

  private async _notifyGeneratedById(generatedById: string, user: User, i18n: I18nContext) {
    const notification: NotificationDto = {
      title: i18n.t('locale.notification_title_generate_new_account', {
        args: {
          userName: user.fullName,
        },
      }),
      body: i18n.t('locale.notification_body_generate_new_account', {
        args: {
          userName: user.fullName,
        },
      }),
    };
    await this.notificationsService.pushNotification(
      {
        userId: generatedById,
        notification: notification,
        type: NotificationType.INFO,
      },
      false,
    );
  }

  private async _getRandomAvatar() {
    // await this.appService.fetchRemoteConfigParams();
    // console.log(`avatars=${Constant.AVATARS.length}`);
    const avatar = sample(Constant.AVATARS);
    return this.attachmentRepo.save({
      name: 'avatar.png',
      url: avatar.imageUrl,
      type: AttachmentType.IMAGE,
    });
  }

  private async _handleLoginByEmail(dto: CreateUserDto, user: User, i18n?: I18nContext) {
    if (dto.loginIfAlreadyExist) {
      if (!user.isGuest) return await this._sendVerifyEmail(user.email, user.type, 'Verify Account', user.debug);
    } else {
      throw new ConflictException(new AppError(ERR_EMAIL_ALREADY_EXIST));
    }
  }

  private async _handleRegisterByEmail(
    dto: CreateUserDto,
    skipSendEmail: boolean = false,
    queryRunner?: QueryRunner,
    i18n?: I18nContext,
  ) {
    const { email, userType, debug } = dto;
    dto.registerProviderType ??= RegisterProviderType.EMAIL;
    const savedUser = await this._createUser(dto, false, i18n, queryRunner);
    if (!skipSendEmail) {
      try {
        const result = await this._sendVerifyEmail(email, userType, 'Verify Account', debug);
        if (debug) return result;
      } catch (e) {
        console.log(e);
      }
    }
    return this._getUserWithTokens(savedUser);
  }

  private async _mergeGuestAndOldUser(guestUser: User, existingUser: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update all daily tracking for existingUser to guestUser
      // await queryRunner.manager.update(DailyTracking, { createdById: existingUser.id }, { createdById: guestUser.id });

      // Update userPost  entries for existingUser to guestUser, excluding duplicates that have same recordingId
      await this._updateUserPosts(queryRunner, guestUser, existingUser);

      // update userChallenge
      await this._updateUserChallenge(queryRunner, guestUser, existingUser);

      // update entries
      await queryRunner.manager.update(Entry, { userId: existingUser.id }, { userId: guestUser.id });

      // update insights
      await queryRunner.manager.update(AiInsight, { userId: existingUser.id }, { userId: guestUser.id });

      // update streaks
      await queryRunner.manager.update(Streak, { createdById: existingUser.id }, { createdById: guestUser.id });

      // update subscriptions
      await queryRunner.manager.update(Subscription, { userId: existingUser.id }, { userId: guestUser.id });
      await queryRunner.manager.update(SubscriptionLog, { userId: existingUser.id }, { userId: guestUser.id });

      // update tasks
      await queryRunner.manager.update(Task, { createdById: existingUser.id }, { createdById: guestUser.id });

      // update fcm tokens
      await queryRunner.manager.update(FcmDevice, { userId: existingUser.id }, { userId: guestUser.id });

      // Update all attachments with uploadedById of existingUser to guestUser;
      await queryRunner.manager.update(Attachment, { uploadedById: existingUser.id }, { uploadedById: guestUser.id });

      // Update all moods
      await queryRunner.manager.update(Mood, { userId: existingUser.id }, { userId: guestUser.id });

      // copy all params from existingUser to guestUser
      this._copyUserParams({ user: guestUser, userCopiedFrom: existingUser });

      // remove existingUser
      await queryRunner.manager.remove(existingUser);

      // commit transaction now:
      await queryRunner.commitTransaction();
    } catch (err) {
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction();
      const appError = err.response instanceof AppError ? (err.response as AppError) : null;
      console.log(err);
      throw new ConflictException(appError ?? new AppError(ERR_MERGE_USERS_DATA, err));
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  private _isTeamMemberByUserType(userType: UserType) {
    // add switch and return boolean false if is MEMBER or PARTNER
    switch (userType) {
      case UserType.MEMBER:
      case UserType.PARTNER:
      case UserType.DOCTOR:
        return false;
      default:
        return true;
    }
  }

  private async _updateUserPosts(queryRunner: QueryRunner, guestUser: User, existingUser: User) {
    const guestPostIds = await queryRunner.manager
      .find(UserPost, {
        where: { userId: guestUser.id },
        select: ['postId'],
      })
      .then((records) => records.map((record) => record.postId));

    await queryRunner.manager.update(
      UserPost,
      {
        userId: existingUser.id,
        postId: Not(In(guestPostIds)),
      },
      { userId: guestUser.id },
    );
  }

  private async _updateUserChallenge(queryRunner: QueryRunner, guestUser: User, existingUser: User) {
    const guestChallengeIds = await queryRunner.manager
      .find(UserChallenge, {
        where: { userId: guestUser.id },
        select: ['challengeId'],
      })
      .then((records) => records.map((record) => record.challengeId));

    await queryRunner.manager.update(
      UserChallenge,
      {
        userId: existingUser.id,
        challengeId: Not(In(guestChallengeIds)),
      },
      { userId: guestUser.id },
    );
  }
}
