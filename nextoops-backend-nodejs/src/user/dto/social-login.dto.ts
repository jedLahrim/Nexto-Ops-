import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserType } from '../enums/user-type.enum';
import { LanguageCode } from '../enums/language-code';

export enum RegisterProviderType {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE',
  PHONE_NUMBER = 'PHONE_NUMBER',
}

export class SocialLoginDto {
  @IsEnum(RegisterProviderType)
  providerType: RegisterProviderType;

  @IsOptional()
  token?: string;

  @IsOptional()
  appleAuthorizationCode: string;

  @IsOptional()
  useBundleId?: boolean;

  @IsOptional()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsEnum(LanguageCode)
  languageCode?: LanguageCode;

  @IsOptional()
  @IsEnum(LanguageCode)
  contentLanguageCode?: LanguageCode;

  @IsString()
  // @IsTimeZone()
  @IsOptional()
  timezone?: string;
}
