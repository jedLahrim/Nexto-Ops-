import { ForbiddenException, Injectable } from '@nestjs/common';
import { Constant } from '../commons/constant';
import { ERR_GENERATE_LINK } from '../commons/errors/errors-codes';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ShareService {
  constructor(private configService: ConfigService) {}

  async createShareLink(path: string, socialImageLink?: string, socialTitle?: string, socialDescription?: string) {
    const firebaseAPIKey = this.configService.get('FIREBASE_WEB_API_KEY');
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
          socialMetaTagInfo: {
            socialImageLink,
            socialTitle,
            socialDescription,
          },
        },
      },
    }).catch(() => {
      throw new ForbiddenException(ERR_GENERATE_LINK);
    });

    return {
      link: response.data.shortLink,
    };
  }
}
