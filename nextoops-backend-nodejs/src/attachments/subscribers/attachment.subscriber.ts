import { DataSource, EntitySubscriberInterface, LoadEvent } from 'typeorm';
import { Attachment } from '../entities/attachment.entity';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { InjectS3, S3 } from 'nestjs-s3';
import { ConfigService } from '@nestjs/config';
import { Constant } from '../../commons/constant';

@Injectable()
export class AttachmentSubscriber implements EntitySubscriberInterface<Attachment> {
  private readonly bucket: string;
  private readonly expiresIn: number;

  constructor(
    private dataSource: DataSource,
    @InjectS3() private readonly s3: S3,
    private configService: ConfigService,
  ) {
    this.bucket = configService.get('AWS_BUCKET_NAME');
    // add it here instead of TypeOrmConfig subscribers
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Attachment;
  }

  async afterLoad(attachment: Attachment, event?: LoadEvent<Attachment>) {
    if (attachment.key) attachment.url = await this._getSignedUrlByKey(attachment.key);
    if (attachment.thumbnailKey) attachment.thumbnailUrl = await this._getSignedUrlByKey(attachment.thumbnailKey);
  }

  async _getSignedUrlByKey(key: string) {
    const presSignedUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: Constant.ATTACHMENT_URL_EXPIRES_IN_SECONDS },
    );
    return process.env.DO_SPACES_CDN + presSignedUrl.split('.com')[1];
  }
}
