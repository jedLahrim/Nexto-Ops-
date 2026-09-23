import { SelectQueryBuilder } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AppError } from './errors/app-error';
import {
  ERR_NO_SIBLING_FOR_ROOT_MEMBER_ORGANIZATION,
  ERR_NOT_VALID_JSON_STRUCTURE,
  ERR_UNAUTHORIZED,
} from './errors/errors-codes';
import { find, isBoolean, isEmpty, orderBy } from 'lodash';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';
import * as moment from 'moment';
import { LastTimeLine, TimelineType } from '../ai/categories/use-cases/dto/use-case-meta-data.dto';
import * as sha256 from 'sha256';
import { Constant } from './constant';
import { LanguageCode } from '../user/enums/language-code';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { InjectionToken } from '@nestjs/common/interfaces/modules/injection-token.interface';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { ClassProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { tz } from 'moment-timezone';
import { ExportType } from '../exports/export-data/enum/export-type.enum';
import axios from 'axios';
import { Post } from '../posts/entities/post.entity';
import { I18nContext, I18nService } from 'nestjs-i18n';
import Ajv from 'ajv';
import { Challenge } from '../challenges/entities/challenge.entity';
import { UserChallenge } from '../challenges/entities/user-challenge.entity';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';
import { AIModel, AIProvider } from '../ai/ai.service';

export class Utils {
  static queryInclude(query: SelectQueryBuilder<any>, relations: string[], allowedRelations: Record<string, any>) {
    // const allowedRelations = ['createdBy', 'child'];
    for (const relation of relations) {
      const allowed = Object.keys(allowedRelations).includes(relation);
      if (allowed) {
        query.leftJoinAndSelect(`${query.alias}.${relation}`, `include_${relation}`);
        const nestedRelations = allowedRelations[relation];
        nestedRelations?.forEach((nestedRelation) => {
          query.leftJoinAndSelect(`include_${relation}.${nestedRelation}`, `include_${relation}_${nestedRelation}`);
        });
      }
    }
  }

  static queryIncludeV2<Entity>(
    query: SelectQueryBuilder<Entity>,
    include: string[],
    allowedRelations: FindOptionsRelations<Entity>,
  ) {
    let allowedFindOptions: FindOptionsRelations<Entity> = {};
    for (let key in allowedRelations) {
      const allowed = include.includes(key);
      if (allowed) allowedFindOptions[key] = allowedRelations[key];
    }
    this.queryNestedInclude<Entity>(query, allowedFindOptions);
  }

  static queryNestedInclude<Entity>(
    query: SelectQueryBuilder<any>,
    findOptions: FindOptionsRelations<Entity>,
    oldIncludeAlias?: string,
  ) {
    const myMap = new Map(Object.entries(findOptions));

    // const allowedRelations = ['createdBy', 'child'];
    for (const [key, value] of myMap) {
      if (isBoolean(value) && value == false) return;
      const property = oldIncludeAlias ?? query.alias;

      // const alias = `include_${property}_${key}`;
      const alias = oldIncludeAlias ? `${oldIncludeAlias}_${key}` : `include_${property}_${key}`;

      query.leftJoinAndSelect(`${property}.${key}`, alias);

      if (!isBoolean(value)) {
        this.queryNestedInclude(query, value as FindOptionsRelations<any>, alias);
      }
    }
  }

  static jsonToQueryParams(json: any): string {
    return Object.keys(json)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(json[key]))
      .join('&');
  }

  static getFormattedDepthStringByNode(nodeUser: User, depth: number, exactDepth?: boolean) {
    // [^/] all characters except /
    // [^/]+  all characters except / & 1 ore more of them
    // \/ cuz / is a part of regex exp so need anti slash to make is just simple string / mean \/ in regex
    // (group here){n,m} the group string from n to m times
    if (depth == null) return `${nodeUser.id}\/([^\/]+\/)*$`;
    if (depth == 0) {
      // get sibling mean get parent of the node User
      if (nodeUser.isRootOrg) {
        throw new NotFoundException(new AppError(ERR_NO_SIBLING_FOR_ROOT_MEMBER_ORGANIZATION));
      }
      return `${nodeUser.parentId}\/([^\/]+\/){0,0}$`;
    } else if (depth > 0) {
      // get children mean get parent of the node User until a depth reached
      const startNodeDepth = exactDepth ? depth - 1 : 0;
      return `${nodeUser.id}\/([^\/]+\/){${startNodeDepth},${depth - 1}}$`;
    } else {
      const nodes = nodeUser.nodes;
      const expTimes = exactDepth ? '{0,0}' : '*';
      const positiveDepth = -depth;
      // depth is negative
      const nodeId = nodes.length >= positiveDepth + 1 ? nodes[nodes.length - (positiveDepth + 1)] : nodeUser.rootId;
      return `${nodeId}\/([^\/]+\/)${expTimes}$`;
    }
  }

  static getStartEndDateByTimeline(lastTimeline: LastTimeLine) {
    const { type, years, months, days, hours, minutes, seconds } = lastTimeline;
    const now = new Date();
    switch (type) {
      case TimelineType.RELATIVE:
        const duration = moment.duration({
          years: years ?? 0,
          months: months ?? 0,
          days: days ?? 0,
          hours: hours ?? 0,
          minutes: minutes ?? 0,
          seconds: seconds ?? 0,
        });

        return {
          startDate: moment().subtract(duration).toDate(),
          endDate: now,
        };
      case TimelineType.TODAY:
        return {
          startDate: moment().startOf('day').toDate(),
          endDate: now,
        };
      case TimelineType.THIS_WEEK:
        return {
          startDate: moment().startOf('week').toDate(),
          endDate: now,
        };
      case TimelineType.THIS_MONTH:
        return {
          startDate: moment().startOf('month').toDate(),
          endDate: now,
        };
      case TimelineType.THIS_YEAR:
        return {
          startDate: moment().startOf('year').toDate(),
          endDate: now,
        };
      case TimelineType.ALL_TIME:
        return {
          startDate: null,
          endDate: now,
        };
    }
    // startDate : today - timeLine
  }

  static friendlyDate(date: Date): string {
    return moment(date).format('ddd DD MMM HH:mm');
  }

  static formatTimestamp(timestamp: number): Date {
    if (timestamp) {
      const date = moment(timestamp);
      return date.toDate();
    } else {
      return null;
    }
  }

  /**
   * Return a random value from a TypeScript enum (string or numeric).
   * Usage: Utils.getRandomEnumValue<MyEnum>(MyEnum)
   */
  static getRandomEnumValue<T>(anEnum: Record<string, any>): T {
    // For string enums Object.keys returns only the keys; for numeric enums keys include reverse mappings.
    // Filter out numeric keys to avoid duplicates for numeric enums.
    const values = Object.keys(anEnum)
      .filter((k) => isNaN(Number(k)))
      .map((k) => anEnum[k]) as T[];

    if (!values || values.length === 0) {
      throw new Error('Enum has no values');
    }

    const idx = Math.floor(Math.random() * values.length);
    return values[idx];
  }
}

export function interpolateVariables(text: string, variables: Record<string, boolean | number | string>): string {
  if (isEmpty(variables)) return text;

  Object.keys(variables).forEach((key) => {
    text = text.replace(key, String(variables[key]));
  });

  console.log(text);

  return text;
}

export function isValidateHash(hash?: string): boolean {
  const today = moment().format('YYYY-MM-DD');
  const hashPrefix = process.env.HASH_PREFIX;
  const value = `${hashPrefix}${today}`;
  const crypted = sha256(value);
  if (crypted != hash) throw new UnauthorizedException(new AppError(ERR_UNAUTHORIZED));
  return true;
}

function isNullOrUndefined<T>(obj: T | null | undefined): obj is null | undefined {
  return typeof obj === 'undefined' || obj === null;
}

export class Schedule {
  month?: number;
  year?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone?: string;
}

export function splitArray(array: any[], chunkSize: number): any[][] {
  const result: string[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getSupportedLanguageCode(i18nLang?: string, userLanguageCode?: LanguageCode): LanguageCode {
  if (i18nLang) {
    const founded = Constant.SUPPORTED_LANGUAGE_CODES.find((value) => value.toString() == i18nLang);
    if (founded) return founded;
  }

  if (userLanguageCode && Constant.SUPPORTED_LANGUAGE_CODES.includes(userLanguageCode)) return userLanguageCode;
  else return Constant.FALLBACK_LANGUAGE_CODE;
}

export function elapsed(beginning: number, log = true) {
  const duration = new Date().getTime() - beginning;
  if (log) {
    console.log(`${duration / 1000}s`);
  }
  return duration;
}

export function getTrimesterByWeek(week?: number): number {
  if (week) {
    const trimester = find(Constant.TRIMESTERS, (t) => week >= t.startWeek && week <= t.endWeek);
    return trimester ? trimester.trimester : null;
  }
  return null;
}

export function getUtcOffsetByTimezone(timezone?: string) {
  return tz(timezone).format('Z');
}

export const ONE_HOUR = 3600000;

export class CacheService implements ClassProvider {
  provide: InjectionToken = APP_INTERCEPTOR;
  useClass: Type = CacheInterceptor;
}

export function getFileNameByType(type: ExportType, docName: string) {
  // Save the workbook to a file
  const exportedAt = new Date().toISOString().replace('/', '_');
  const ext = getExtensionByExportType(type);
  return `SenLife_Document_${docName}_${exportedAt}_${ext}.${ext}`;
}

export function getExtensionByExportType(type: ExportType) {
  switch (type) {
    case ExportType.PDF:
      return 'pdf';
    case ExportType.CSV:
      return 'csv';
    case ExportType.EXCEL:
      return 'xlsx';
  }
}

export async function getBufferFromUrl(url: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  return buffer;
}

export function createBasicAuthToken(username: string, password: string): string {
  const credentials = `${username}:${password}`;

  // Browser-compatible base64 encoding using btoa
  const encodedCredentials = btoa(credentials);

  return `Basic ${encodedCredentials}`;
}

export function setPostParams(post: Post, languageCode = Constant.FALLBACK_LANGUAGE_CODE, i18n: I18nContext) {
  if (!isEmpty(post.tagPosts)) {
    post.tagPosts = post.tagPosts.map((value) => {
      value.tag = value.tag.setI18n(i18n);
      return value;
    });
  }
  if (!isEmpty(post.translations)) {
    let founded = post.translations[0];
    // order attachmentPosts by orderIndex ALSO set translation with languageCode
    post.translations.forEach((translation) => {
      if (languageCode && translation.languageCode == languageCode) founded = translation;
      if (!isEmpty(translation.attachmentPosts)) {
        translation.attachmentPosts = orderBy(translation.attachmentPosts, ['orderIndex'], 'asc');
      }
    });

    // order post related
    if (post.postRelatedPosts) post.postRelatedPosts = orderBy(post.postRelatedPosts, ['orderIndex'], 'asc');
    post.title = founded.title;
    post.description = founded.description;
    post.html = founded.html;
    post.quillData = founded.quillData;
    post.externalUrl = founded.externalUrl;
    post.primaryAttachment = founded.primaryAttachment;
    post.secondaryAttachment = founded.secondaryAttachment;
    post.attachmentPosts = founded.attachmentPosts;
  }

  return post;
}

export function parseJsonResponse(raw: string): any {
  try {
    const cleaned = String(raw)
      .trim()
      .replace(/^```(json)?/i, '')
      .replace(/```$/, '');
    return JSON.parse(cleaned);
  } catch {
    throw new BadRequestException(new AppError(ERR_NOT_VALID_JSON_STRUCTURE));
  }
}

export function validateWithSchema(payload: any, schema: object) {
  const ajv = new Ajv({ allErrors: true } as any);

  const validate = ajv.compile(schema as any);
  const ok = validate(payload);
  if (!ok) {
    const msg = (validate.errors || [])
      .map((e: any) => `${e.instancePath || e.dataPath || ''} ${e.message}`)
      .join('; ');
    throw new Error(`JSON does not match schema: ${msg}`);
  }
  return payload;
}

export function getI18nContextByLang(lang: LanguageCode, i18nService: I18nService) {
  return new I18nContext(lang, i18nService, {
    fallbackLanguage: Constant.FALLBACK_LANGUAGE_CODE,
    loaderOptions: {},
  });
}

export function dayKeyLocal(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function localDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function dayKeyServer(date: Date): string {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

export function dayBoundsServer(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function startEndOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function toDayString(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export const SUPPORTED_OFFSETS: string[] = [
  '-12:00',
  '-11:00',
  '-10:00',
  '-09:00',
  '-08:00',
  '-07:00',
  '-06:00',
  '-05:00',
  '-04:00',
  '-03:00',
  '-02:00',
  '-01:00',
  '+00:00',
  '+01:00',
  '+02:00',
  '+03:00',
  '+03:30',
  '+04:00',
  '+04:30',
  '+05:00',
  '+05:30',
  '+05:45',
  '+06:00',
  '+06:30',
  '+07:00',
  '+08:00',
  '+08:45',
  '+09:00',
  '+09:30',
  '+10:00',
  '+10:30',
  '+11:00',
  '+12:00',
  '+13:00',
  '+14:00',
];

export function addOffset(utc: Date, offset: string): { hour: number; minute: number } {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.slice(1).split(':').map(Number);
  const minutes = sign * (h * 60 + (m || 0));
  const localMs = utc.getTime() + minutes * 60_000;
  const d = new Date(localMs);
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

export function getOffsetsNearLocal(targetHour: number, targetMinute: number, windowMin: number): string[] {
  const nowUtc = new Date();
  return SUPPORTED_OFFSETS.filter((off) => {
    const { hour, minute } = addOffset(nowUtc, off);
    const diff = Math.abs(hour * 60 + minute - (targetHour * 60 + targetMinute));
    return diff <= windowMin;
  });
}

export function setChallengeParams(
  challenge: Challenge,
  languageCode = Constant.FALLBACK_LANGUAGE_CODE,
  userChallenge?: UserChallenge,
  user?: User,
) {
  if (userChallenge) {
    challenge.startAt = userChallenge.startAt;
    challenge.trackedEntryDays = userChallenge.trackedEntryDays;
    challenge.trackedEntryCount = userChallenge.trackedEntryCount;
    challenge.status = userChallenge.status;
  }

  if (!isEmpty(challenge.translations)) {
    let founded = challenge.translations[0];
    // order attachmentPosts by orderIndex ALSO set translation with languageCode
    challenge.translations.forEach((translation) => {
      if (languageCode && translation.languageCode == languageCode) founded = translation;
    });

    // order post related
    challenge.title = founded.title;
    challenge.description = founded.description;
    challenge.html = founded.html;
    challenge.whatToExpect = founded.whatToExpect;
  }

  return challenge;
}

export function setUseCaseParams(useCase: UseCase, languageCode = Constant.FALLBACK_LANGUAGE_CODE) {
  if (!isEmpty(useCase.translations)) {
    let founded = useCase.translations[0];

    useCase.translations.forEach((translation) => {
      if (languageCode && translation.languageCode == languageCode) founded = translation;
    });

    useCase.languageCode = founded.languageCode;
    useCase.shortText = founded.shortText;
    // useCase.question = founded.question;
  }

  return useCase;
}

export function getInsightAIModelByAIProvider(aiProvider: AIProvider) {
  switch (aiProvider) {
    case AIProvider.CLAUDE_AI:
      return AIModel.CLAUDE_3_5_SONNET;
    case AIProvider.OPEN_AI:
      return AIModel.GPT4O;
    default:
      return AIModel.GPT4O;
  }
}
