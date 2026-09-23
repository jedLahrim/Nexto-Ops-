import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { RegisterProviderType } from './social-login.dto';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';
import { LanguageCode } from '../enums/language-code';
import { TransformBoolean } from '../../commons/decorators/transform-boolean.decorator';
import { OnBoardingStep } from '../enums/onboarding-step.enum';

export class CreateUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  guestEmail?: string;

  @IsString()
  // @MinLength(4)
  // @MaxLength(20)
  @IsOptional()
  fullName?: string;

  @IsBoolean()
  @TransformBoolean({ defaultValue: true })
  loginIfAlreadyExist: boolean;

  @IsString()
  // @MinLength(4)
  // @MaxLength(20)
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  appleId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'Invalid country code' })
  countryCode?: string;

  @IsOptional()
  @IsEnum(LanguageCode)
  languageCode?: LanguageCode;

  @IsOptional()
  @IsEnum(LanguageCode)
  contentLanguageCode?: LanguageCode;

  @IsBoolean()
  @IsOptional()
  isApplePrivateEmail?: boolean;

  @IsOptional()
  profileImageAttachment?: Attachment;

  @IsOptional()
  @TransformBoolean({ defaultValue: false })
  isFirstLogin?: boolean;

  @IsEnum(UserType)
  userType: UserType;

  @IsEnum(RegisterProviderType)
  @IsOptional()
  registerProviderType?: RegisterProviderType = RegisterProviderType.EMAIL;
  @Matches(/(\+)?\d{5,}$/, {
    message: 'invalid phone number',
  })
  @IsOptional()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isDemo?: boolean;

  @IsOptional()
  @IsBoolean()
  isTeamMember?: boolean;

  @IsOptional()
  @IsBoolean()
  isDeveloper?: boolean;
  @IsBoolean()
  @IsOptional()
  debug: boolean;

  @IsOptional()
  @TransformJson
  extraData?: {};

  @IsOptional()
  @TransformJson
  onboardingData?: {};

  @IsOptional()
  @IsNumber()
  onboardingVersion?: number;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(32)
  password?: string;

  @IsOptional()
  @IsEnum(OnBoardingStep)
  onBoardingStep?: OnBoardingStep;

  onb;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;

  @IsOptional()
  @IsDate()
  birthdayAt?: Date;

  @IsOptional()
  @IsNumber()
  appVersion: number;

  @IsBoolean()
  @TransformBoolean({ defaultValue: false })
  @IsOptional()
  isGuest?: boolean;

  // constructor(
  //   email: string,
  //   userType: UserType,
  //   fullName?: string,
  //   attachment?: Attachment,
  //   registerProviderType?: RegisterProviderType,
  //   phoneNumber?: string,
  //   appleId?: string,
  //   isApplePrivateEmail?: boolean,
  //   countryCode?: string,
  //   password?: string,
  //   languageCode?: LanguageCode,
  // ) {
  //   this.email = email;
  //   this.userType = userType;
  //   this.fullName = fullName;
  //   this.profileImageAttachment = attachment;
  //   this.registerProviderType = registerProviderType ?? RegisterProviderType.EMAIL;
  //   this.phoneNumber = phoneNumber;
  //   this.appleId = appleId;
  //   this.isApplePrivateEmail = isApplePrivateEmail;
  //   this.countryCode = countryCode;
  //   this.password = password;
  //   this.languageCode = languageCode;
  // }

  constructor(object?: Partial<CreateUserDto>) {
    this.registerProviderType = object?.registerProviderType ?? RegisterProviderType.EMAIL;
    Object.assign(this, object);
  }
}
