import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { v4 as uuid } from 'uuid';
import { Attachment } from './entities/attachment.entity';
import { In, IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ERR_NOT_FOUND_ATTACHMENT,
  ERR_NOT_FOUND_ATTACHMENTS,
  ERR_PRIMARY_ATTACHMENT_NOT_IN_ATTACHMENTS,
  ERR_UPLOAD_FAILED,
} from '../commons/errors/errors-codes';
import { AppError } from '../commons/errors/app-error';
import { GetObjectCommand, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { User } from '../user/entities/user.entity';
import { InjectS3, S3 } from 'nestjs-s3';
import { RequestPresigningArguments } from '@smithy/types';
import { AttachmentType } from './enums/attachment-type';
import pTimeout from 'p-timeout';
import { blurhashFromURL } from 'blurhash-from-url';
import { Constant } from '../commons/constant';
import * as sharp from 'sharp';
import { AvailableFormatInfo, FormatEnum } from 'sharp';

@Injectable()
export class AttachmentsService {
  // bucket: string;

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
    @InjectS3() private readonly s3: S3,
  ) {
    // this.bucket = this.configService.get('AWS_BUCKET_NAME');
  }

  async upload(file: Express.Multer.File, dto: UploadAttachmentDto, user?: User) {
    try {
      const key = `${uuid()}-${file.originalname}`;
      const bucket = this._getBucket(dto.public);
      const result = await this._uploadS3(file, key, bucket, dto.public);
      const url = await this._getAttachmentUrl(bucket, key, dto.public);

      // save attachment after upload
      const { name, type, metaData, enableInstantThumbnail } = dto;
      let attachment = this.attachmentRepo.create({
        name: name ?? key,
        url: url,
        key: key,
        type,
        metaData,
        uploadedById: user?.id,
        bucket: bucket,
      });
      if (enableInstantThumbnail) attachment = await this.generateThumbnail(file, attachment, bucket);

      return this.attachmentRepo.save(attachment);
    } catch (e) {
      throw new ConflictException(new AppError(ERR_UPLOAD_FAILED));
    }
  }

  async checkAttachmentsExist(attachments?: Attachment[]): Promise<Attachment[]> {
    const ids = attachments.map((attachment) => attachment?.id);
    const foundedAttachments = await this.attachmentRepo.findBy({
      id: In(ids),
    });
    if (attachments?.length != foundedAttachments?.length)
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ATTACHMENTS));

    // return sorted as attachments array
    return attachments.map((attachment) => foundedAttachments.find((value) => value.id == attachment.id));
  }

  // private async _uploadS3(file: Express.Multer.File, key: string, publicUpload: boolean = false) {
  //   const bucket = this.configService.get('AWS_BUCKET_NAME');
  //   const params: PutObjectCommandInput = {
  //     Body: file.buffer,
  //     Bucket: bucket,
  //     Key: key,
  //     ContentType: file.mimetype,
  //   };
  //
  //   return await this.s3.send(new PutObjectCommand(params));
  // }

  async checkAttachmentExistOrFail(attachmentId: string): Promise<Attachment> {
    const foundedAttachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId },
    });
    if (!foundedAttachment) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ATTACHMENT));
    } else {
      return foundedAttachment;
    }
  }

  checkPrimaryInAttachments(attachments: Attachment[], primaryAttachment: Attachment) {
    /// Check primary attachment and assign it to event
    const foundedPrimaryAttachment = attachments.find((value) => value.id == primaryAttachment.id);

    if (!foundedPrimaryAttachment) throw new NotFoundException(new AppError(ERR_PRIMARY_ATTACHMENT_NOT_IN_ATTACHMENTS));
  }

  async remove(id: string) {
    const result = await this.attachmentRepo.delete({ id });
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_ATTACHMENT));
    }
  }

  findOne(id: string) {
    return this.attachmentRepo.findOne({ where: { id } });
  }

  async getSignedUrl(bucket: string, key: string, options?: RequestPresigningArguments) {
    const presSignedUrl = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
      options,
    );
    return process.env.DO_SPACES_CDN + presSignedUrl.split('.com')[1];
  }

  async handleAttachmentApplyBlur() {
    let attachments = await this.attachmentRepo.find({
      where: { blurHash: IsNull(), type: AttachmentType.IMAGE },
      relations: {
        primaryPostTranslation: true,
      },
    });

    // attachments = attachments.filter((value) => value.primaryPostTranslation);

    const result = [];
    for (const attachment of attachments) {
      const blurred = await this.blurImage(attachment);
      if (blurred) result.push(blurred);
    }

    // const result = await Promise.all(attachments.map((attachment, index) => this._blurImage(attachment)));
    const filteredResult = result.filter((value) => value.blurHash);

    await this.attachmentRepo.save(filteredResult, { chunk: 100 });
    console.log(`saved ${filteredResult.length}`);
  }

  async blurImage(attachment: Attachment) {
    if (attachment.url) {
      try {
        attachment.blurHash = (await pTimeout(blurhashFromURL(attachment.url), 2000)).encoded;
        if (attachment.thumbnailUrl) {
          attachment.thumbnailBlurHash = (await pTimeout(blurhashFromURL(attachment.thumbnailUrl), 2000)).encoded;
        }
        console.log(` hash=${attachment.blurHash}`);
        return attachment;
      } catch (e) {
        console.log(e);
        return null;
      }
    }
    return attachment;
  }

  async generateThumbnail(file: Express.Multer.File, attachment: Attachment, bucket: string) {
    try {
      await pTimeout(this.compressImage(file, 25), 3000);
      const thumbnailKey = `${uuid()}-thumbnail-${attachment.name}`;
      const result = await this._uploadS3(file, thumbnailKey, bucket);
      const thumbnailUrl = await this.getSignedUrl(bucket, thumbnailKey);
      attachment.thumbnailKey = thumbnailKey;
      attachment.thumbnailUrl = thumbnailUrl;
      return attachment;
    } catch (e) {
      return attachment;
    }
  }

  async compressImage(file: Express.Multer.File, quality: number = 60) {
    const imageExtension = Constant.FILE_EXTENSION(file) as keyof FormatEnum | AvailableFormatInfo;
    file.buffer = await sharp(file.buffer)
      .toFormat(imageExtension, { quality: quality }) // Adjust quality as needed (0-100)
      .toBuffer();
  }

  private async _uploadS3(file: Express.Multer.File, key: string, bucket: string, publicUpload: boolean = false) {
    const params: PutObjectCommandInput = {
      Body: file.buffer,
      Bucket: bucket,
      Key: key,
      ContentType: file.mimetype,
      ACL: publicUpload ? 'public-read' : undefined,
    };

    return await this.s3.send(new PutObjectCommand(params));
  }

  private async getPublicUrl(bucket: any, key: string) {
    return process.env.DO_SPACES_CDN + `/${bucket}/${key}`;
  }

  private _getBucket(publicUpload: boolean) {
    return publicUpload ? Constant.STATIC_BUCKET_FOLDER : this.configService.get('AWS_BUCKET_NAME');
  }

  private async _getAttachmentUrl(bucket: any, key: string, publicUpload: boolean) {
    return publicUpload ? await this.getPublicUrl(bucket, key) : await this.getSignedUrl(bucket, key);
  }
}
