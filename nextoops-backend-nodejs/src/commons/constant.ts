import * as moment from 'moment';
import { LanguageCode } from '../user/enums/language-code';
import { DataMergeTypeEnum } from '../user/enums/data-merge-type.enum';

export class Constant {
  static TIME_ZONE: string = 'UTC';
  static CODE_EXPIRES_IN_MILI = 600000;
  static ENABLE_REMOVE_EXPIRED_SHARE_CHILD_INVITATION = true;
  static ENABLE_MAILCHIMP = false;
  static ENABLE_MAUTIC = false;
  static MAX_CHUNK_MAUTIC_PRE_REQUEST = 100;
  static WEBSITE: string = 'https://yozen.app';
  static STATIC_BUCKET_FOLDER: string = 'public';

  // 6 hours
  static ATTACHMENT_URL_EXPIRES_IN_SECONDS = 604000;
  static DYNAMIC_LINK_DOMAIN_URI_PREFIX = 'https://yozen.page.link';
  static APP_ICON = 'https://yozen-app-bucket.nyc3.cdn.digitaloceanspaces.com/static/icon.png';
  static APP_ICON_MAILING = 'https://yozen-app-bucket.nyc3.cdn.digitaloceanspaces.com/static/yozen_mail_logo.png';

  static ACCESS_EXPIRES_IN = '8w';
  static REFRESH_EXPIRES_IN = '120d';
  // static TEAM_MEMBER_ACCESS_EXPIRES_IN = '24h';
  // static TEAM_MEMBER_REFRESH_EXPIRES_IN = '24h';

  static SHARED_CHILD_TOKEN_EXPIRES_IN = '72h';
  static MAGIC_LINK_USER_LOGIN_EXPIRES_IN = '72h';
  static POST_SCHEDULE_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
  static FACEBOOK_FIELDS = 'id,email,first_name,last_name,picture';
  static TIME_TO_CANCEL_SHARE_CHILD_IN_MILLISECONDS = moment.duration(2, 'days').asMilliseconds();
  static GOOGLE_CLOUD_SPEECH_SUPPORTED_AUDIO_EXTENSION = ['mp3', 'wav', 'ogg', 'web', 'flac'];
  static RECOGNITION_SAMPLE_RATE_HERTZ_CONFIG = 16000;
  static NOTIFICATION_API_URL = 'https://fcm.googleapis.com/fcm/send';
  static ANDROID_PACKAGE_NAME = 'com.yozen.app';
  static IOS_BUNDLE_ID = 'com.yozen.app';
  static IOS_APP_STORE_ID = '6752788608';
  static TAKE = 4;
  static SKIP = 0;
  static MEMBER_QUEUE = 'member_queue';
  static POST_PUSH_NOTIFICATION_QUEUE = 'partner_push_notification_queue';
  static ALLOW_CACHE_GET_APIS = true;

  static MEMBER_PUSH_NOTIFICATION_AFTER_30_MIN_OF_REGISTER = 'member_push_notification_after_30_min_of_register';
  static MEMBER_EXECUTE_WEEKLY_USE_CASE = 'member_execute_weekly_use_case';
  static MEMBER_EXECUTE_MONTHLY_USE_CASE = 'member_execute_monthly_use_case';

  // static MEMBER_PUSH_NOTIFICATION_AFTER_24_HOURS_OF_WELCOME = 'member_push_notification_after_24_hours_of_welcome';

  // static MEMBER_PUSH_NOTIFICATION_AFTER_3DAYS_SOMETHING_ADDED = 'member_push_notification_after3days_something_added';

  static PARENT_PUSH_NOTIFICATION_AFTER_NOTHING_ADDED_24_HOURS_OF_LAST_24_HOURS =
    'parent_push_notification_after_nothing_added_24_hour_of_last_24_hour';

  static PARENT_PUSH_NOTIFICATION_AFTER_NOTHING_ADDED_FOR_NEXT_WEEK =
    'parent_push_notification_nothing_added_for_next_week';

  static PARENT_PUSH_NOTIFICATION_AFTER_24_HOURS_SOMETHING_ADDED =
    'parent_push_notification_after24_hours_something_added';

  static ADMIN_PUSH_NOTIFICATION_ON_WEEKEND_OBJECTIVE_REACHED = 'admin_push_notification_on_weekend_objective_reached';

  static scheduleTimes = {
    AFTER_30MIN: '30min',
    AFTER_24H: '24h',
    AFTER_72H: '72h',
    AFTER_WEEK: '1week',
    AFTER_MONTH: '30days',
  };

  /*static demoScheduleTimes = {
    AFTER_30MIN: '10sec',
    AFTER_24H: '20s',
    AFTER_72H: '30s',
    AFTER_WEEK: '15sec',
  };*/

  static GUEST_EMAIL_DOMAIN: string = 'yozen.app';
  static GUEST_REGISTER_OLD_USER_MERGE_TYPE = DataMergeTypeEnum.MERGE;

  static demoScheduleTimes = {
    AFTER_30MIN: '5s',
    AFTER_24H: '5min',
    AFTER_72H: '15min',
    AFTER_WEEK: '5sec',
  };

  static PLUS_ENTITLEMENT_ID: string = 'yozen_plus';
  static MAX_ATTACHMENT_SIZE_MO = {
    IMAGE: 50,
    VIDEO: 100,
    AUDIO: 100,
    PDF: 50,
    XLSX: 50,
    DOC: 50,
    PPT: 50,
    SVG: 50,
    TXT: 50,
    GIF: 50,
    FILE: 50,
  };
  static WEB_APP_LINK: string = 'https://app.yozen.app';
  static WEBSITE_LINK: string = 'https://yozen.app';
  static ENABLE_MAUTIC_DEBOUNCE = true;
  // ];
  static SUPPORTED_LANGUAGE_CODES = Object.values(LanguageCode);
  static FALLBACK_LANGUAGE_CODE = LanguageCode.EN;
  static ONE_WEEK: number = 7 * 24 * 60 * 60 * 1000;
  static MIN_DAILY_TOTAL_FOR_ADMIN_NOTIFICATION: number = 4;
  static AVATARS: Array<{ imageUrl: string }>;
  static IMGBB_API_URL: string = 'https://api.imgbb.com/1/upload';
  static IMGBB_API_EXPIRATIONS: number = 600;
  static ADMIN_EMAILS: string[] = ['admin@yozen.app'];

  static TRIMESTERS = [
    { trimester: 1, startWeek: 1, endWeek: 12 },
    { trimester: 2, startWeek: 13, endWeek: 26 },
    { trimester: 3, startWeek: 27, endWeek: 42 },
  ];
  static MAX_NOTIFICATION_ATTACHMENT_WIDTH = 1242.0;
  static MAX_NOTIFICATION_ATTACHMENT_HEIGHT = 1242.0;

  static X_DAYS = function (days: number) {
    return days * 24 * 60 * 60 * 1000;
  };

  static randomCodeString = function (length = 6) {
    return Math.random().toString(20).substr(2, length);
  };

  static FIREBASE_DYNAMIC_LINK = function (path: string, baseUrl?: string) {
    return `${baseUrl ?? 'https://app.yozen.app'}/${path}`;
  };

  static FIREBASE_URL = function (firebaseAPIKey) {
    return `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${firebaseAPIKey}`;
  };

  static getIdNumber = function () {
    return Math.floor(Math.random() * 1000) + 1;
  };

  static FACEBOOK_URL = function (facebookFields, facebookToken) {
    return `https://graph.facebook.com/v12.0/me?fields=${facebookFields}&access_token=${facebookToken}`;
  };

  static shareChildQueueDelayExecution = (expiredAt: Date) => {
    return expiredAt.getTime() - new Date().getTime() + this.TIME_TO_CANCEL_SHARE_CHILD_IN_MILLISECONDS;
  };

  static GOOGLE_URL = function (googleToken) {
    return `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleToken}`;
  };

  static NOTIFICATION_HEADERS = (serverKey: string) => {
    return {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/assets',
    };
  };

  static FILE_EXTENSION = function (file: Express.Multer.File) {
    return file.originalname.split('.').pop();
  };
  // for testing
  static ALLOW_ENTRY_CREATED_BY_TRACKING_SAME_DAY = false;
  static ALLOW_TRANSCRIPTION_MIN_WORDS = 4;
  static API_URL = 'http://localhost:3000';
  static PRODUCT_SERVICE = 'PRODUCT_SERVICE';
  static NOTIFY_SERVICE = 'NOTIFY_SERVICE';

  static REGENERATED_CONTENT(content: string) {
    return `Please regenerate this:\n ${content}\n in other way`;
  }

  static LONGER_CONTENT(answer: string) {
    return `Please make this:\n ${answer}\n in ${answer.length * 1.5} characters or more`;
  }

  static SHORTER_CONTENT(content: string) {
    return `Please summarize this:\n ${content}\n in ${content.length * 0.5} characters at max`;
  }

  static CacheTTL(days: number = 3) {
    return Constant.X_DAYS(days);
  }
}
