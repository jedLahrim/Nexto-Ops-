import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Constant } from './commons/constant';
import * as admin from 'firebase-admin';
import { RemoteConfig } from 'firebase-admin/lib/remote-config';
import { hostname } from 'node:os';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  remoteConfig: RemoteConfig;

  constructor() {}

  async onApplicationBootstrap(): Promise<any> {
    this.remoteConfig = admin.remoteConfig();
    await this.fetchRemoteConfigParams();
  }

  async fetchRemoteConfigParams() {
    const rc = await this.remoteConfig.getServerTemplate();
    const config = rc.evaluate();
    const { avatars }: { avatars: Array<{ imageUrl: string }> } = JSON.parse(config.getString('avatars'));
    Constant.AVATARS = avatars;
    Constant.WEBSITE_LINK = config.getString('website_link');
  }

  getHello(): string {
    const tls = process.env.REDIS_TLS ? {} : null;
    const port = process.env.ENV == 'prod' ? process.env.PORT : 3000;
    return `v2 Server running at ${hostname()}:${port} tls=${tls}`;
  }

  getStatus() {
    return '';
  }
}
