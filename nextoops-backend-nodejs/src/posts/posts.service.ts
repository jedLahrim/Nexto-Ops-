import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { AppError } from '../commons/errors/app-error';
import {
  ERR_NOT_FOUND_CATEGORY,
  ERR_NOT_FOUND_POST,
  ERR_NOT_FOUND_TAG,
  ERR_POST_TRANSLATION_ALREADY_EXIST,
  ERR_PUBLISHED_DATE_BIGGER_THAN_UNPUBLISHED_DATE,
  ERR_START_DATE_BIGGER_THAN_END_DATE,
} from '../commons/errors/errors-codes';
import { Post } from './entities/post.entity';
import { Tag } from './tags/entities/tag.entity';
import { ConfigService } from '@nestjs/config';
import { Attachment } from '../attachments/entities/attachment.entity';
import { AttachmentsService } from '../attachments/attachments.service';
import { ShareService } from '../share/share.service';
import { UserPost } from './entities/user-post.entity';
import { Pagination } from '../commons/pagination/pagination';
import { FilterPostDto, PostOrderBy } from './dto/filter-post.dto';
import { AttachmentPost } from './entities/attachment-post.entity';
import { TagPost } from './entities/tag-post.entity';
import { SortType } from '../commons/enums/sortType';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Constant } from '../commons/constant';
import { I18nContext } from 'nestjs-i18n';
import { NotificationDto } from '../notifications/dto/push-notification.dto';
import { NotificationChannelKey } from '../notifications/enum/notification-channel-key.enum';
import { NotificationType } from '../notifications/enum/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { PostRelatedPost } from './entities/related-post.entity';
import { PostTranslation } from './entities/post-translation.entity';
import { CreatePostTranslationDto } from './dto/create-post-translation.dto';
import { UpdatePostTranslationDto } from './dto/update-post-translation.dto';
import { getSupportedLanguageCode, setPostParams, Utils } from '../commons/utils';
import { rethrow } from '@nestjs/core/helpers/rethrow';
import { Category } from './categories/entities/category.entity';
import { PostCategory } from './categories/entities/post-category.entity';
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(PostTranslation)
    private postTranslationRepo: Repository<PostTranslation>,
    @InjectRepository(UserPost)
    private userPostRepo: Repository<UserPost>,
    @InjectRepository(AttachmentPost)
    private attachmentPostRepo: Repository<AttachmentPost>,
    @InjectRepository(TagPost)
    private tagPostRepo: Repository<TagPost>,
    @InjectRepository(PostCategory)
    private postCategoryRepo: Repository<PostCategory>,
    @InjectRepository(PostRelatedPost)
    private relatedPostRepo: Repository<PostRelatedPost>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    private configService: ConfigService,
    private shareService: ShareService,
    private attachmentsService: AttachmentsService,
    private notificationsService: NotificationsService,
    @InjectQueue('notify_me_later_queue') private notifyLaterQueue: Queue,
  ) {}

  async create(createPostDto: CreatePostDto, i18n: I18nContext, me: User) {
    let {
      name,
      type,
      publishedAt,
      unpublishedAt,
      tags,
      categories,
      alwaysVisible,
      relatedPosts,
      contentType,
      translations,
      isPremium,
      subjectType,
      visible,
      key,
    } = createPostDto;
    if (publishedAt && unpublishedAt && publishedAt > unpublishedAt) {
      throw new ConflictException(new AppError(ERR_PUBLISHED_DATE_BIGGER_THAN_UNPUBLISHED_DATE));
    }

    let post = this.postRepo.create({
      name: name,
      type,
      contentType,
      publishedAt,
      unpublishedAt,
      alwaysVisible,
      isPremium,
      subjectType,
      visible,
      key,
    });

    const saved = await this.postRepo.save(post);
    if (tags) saved.tagPosts = await this._saveTagPost(saved.id, tags);
    if (categories) saved.postCategories = await this._savePostCategory(saved.id, categories);
    if (relatedPosts) saved.postRelatedPosts = await this._saveRelatedPost(saved.id, relatedPosts);

    if (translations) {
      saved.translations = await this.savePostTranslation(translations, saved.id, true);
      // TODO: push notification to all users with different languages
      // await this._handleCreatedPostPushNotification(i18n, savedPost);
    }

    return this.findOne(saved.id, me, i18n);
  }

  _getAttachmentPostByAttachments(attachments: Attachment[], postTranslationId?: string) {
    const attachmentPosts: AttachmentPost[] = [];
    attachments?.forEach((attachment, index) => {
      let attachmentPost = this.attachmentPostRepo.create({
        postTranslationId,
        attachment: attachment,
        orderIndex: index,
      });
      attachmentPosts.push(attachmentPost);
    });

    return attachmentPosts;
  }

  async savePostTranslation(
    dtos: CreatePostTranslationDto[],
    id: string,
    deletePrevious?: boolean,
    queryRunner?: QueryRunner,
  ) {
    if (deletePrevious) {
      queryRunner
        ? await queryRunner.manager.delete(PostTranslation, {
            baseId: id,
          })
        : await this.postTranslationRepo.delete({ baseId: id });
    }
    const postTranslations = dtos.map((value) => {
      const attachmentPosts = this._getAttachmentPostByAttachments(value.attachments);

      return this.postTranslationRepo.create({
        title: value.title,
        baseId: id,
        languageCode: value.languageCode,
        description: value.description,
        externalUrl: value.externalUrl,
        html: value.html,
        quillData: value.quillData,
        attachmentPosts: attachmentPosts,
        primaryAttachment: value.primaryAttachment,
        secondaryAttachment: value.secondaryAttachment,
      });
    });

    return queryRunner
      ? await queryRunner.manager.save(postTranslations)
      : await this.postTranslationRepo.save(postTranslations);
  }

  async _checkPostsExist(posts?: Post[]): Promise<Post[]> {
    const ids = posts.map((attachment) => attachment.id);
    const foundedAttachments = await this.postRepo.findBy({
      id: In(ids),
    });
    if (posts.length != foundedAttachments.length) throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));

    // return sorted as attachments array
    return posts.map((attachment) => foundedAttachments.find((value) => value.id == attachment.id));
  }

  async findAll(dto: FilterPostDto, me: User, i18n: I18nContext) {
    console.log('GET ALL posts');
    let {
      startDate,
      endDate,
      published,
      tagIds,
      categoriesIds,
      search,
      includeHidden,
      contentTypes,
      type,
      symptomIds,
      include,
      includeAllTranslations,
      postRelatedId,
      subjectType,
    } = dto;

    if (me.isTeamMember) includeHidden = true;
    const contentLanguageCode = getSupportedLanguageCode(i18n?.lang, me.contentLanguageCode);

    const query = this.postRepo.createQueryBuilder('post');

    query.leftJoinAndSelect('post.translations', 'translation');
    query.leftJoinAndSelect('translation.primaryAttachment', 'translation_primaryAttachment');
    query.leftJoinAndSelect('translation.secondaryAttachment', 'translation_secondaryAttachment');

    if (includeAllTranslations) {
      query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .from(PostTranslation, 'translation')
          .where('translation.baseId = post.id')
          .andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode })
          .getQuery();
        return `EXISTS ${subQuery}`;
      });
    } else {
      query.andWhere('translation.languageCode = :languageCode', { languageCode: contentLanguageCode });
    }

    if (!includeHidden) {
      query.andWhere('post.visible = :visible', { visible: true });
    }

    if (type) {
      query.andWhere('post.type = :type', { type });
    }

    if (subjectType) {
      query.andWhere('post.subjectType = :subjectType', { subjectType });
    }

    if (contentTypes) {
      query.andWhere('post.contentType IN (:...contentTypes)', { contentTypes });
    }


    if (search) {
      query.andWhere(
        `(LOWER(translation.title) LIKE LOWER(:search) OR LOWER(translation.description) LIKE LOWER(:search) OR LOWER(translation.html) LIKE LOWER(:search))`,
        {
          search: `%${search}%`,
        },
      );
    }

    if (tagIds) {
      query
        .innerJoin('post.tagPosts', 'tagPost')
        .innerJoin('tagPost.tag', 'tag')
        .andWhere('tag.id IN (:...tagIds)', { tagIds });
    }

    if (categoriesIds) {
      query
        .innerJoin('post.postCategories', 'postCategory')
        .innerJoin('postCategory.category', 'category')
        .andWhere('category.id IN (:...categoriesIds)', { categoriesIds });
    }

    if (symptomIds) {
      query
        .innerJoin('post.postSymptoms', 'postSymptom')
        .innerJoin('postSymptom.symptom', 'symptom')
        .andWhere('symptom.id IN (:...symptomIds)', { symptomIds });
    }

    // fetch all post that is related to postId
    if (postRelatedId) {
      query
        .innerJoin('post_related_post', 'prp', 'prp.relatedId = post.id')
        .addSelect('prp.orderIndex', 'prp_orderIndex')
        .andWhere('prp.postId = :postId', { postId: postRelatedId });

      if (!dto.orderBy) query.orderBy('prp_orderIndex', 'ASC');
    }

    const allowedRelations: FindOptionsRelations<Post> = {
      tagPosts: { tag: true },
      postCategories: { category: true },
      // translations: { attachmentPosts: { attachment: true }, primaryAttachment: true },
      // todo: to remove for user after version 1.5.0
      // postRelatedPosts: {
      //   related: {
      //     translations: {
      //       // attachmentPosts: { attachment: true },
      //       primaryAttachment: true,
      //       secondaryAttachment: true,
      //     },
      //   },
      // },
      userPosts: true,
    };

    if (include) {
      Utils.queryIncludeV2<Post>(query, include, allowedRelations);
    }

    if (include?.includes('translation_attachmentPosts')) {
      query
        .leftJoinAndSelect('translation.attachmentPosts', 'attachmentPost')
        .leftJoinAndSelect('attachmentPost.attachment', 'attachmentPost_attachment');
    }

    if (include?.includes('postRelatedPosts')) {
      query
        .leftJoinAndSelect('post.postRelatedPosts', 'postRelatedPost')
        .leftJoinAndSelect('postRelatedPost.related', 'postRelatedPost_related')
        .leftJoinAndSelect('postRelatedPost_related.translations', 'related_translation')
        .andWhere('related_translation.languageCode = :languageCode', { languageCode: contentLanguageCode })
        .leftJoinAndSelect('related_translation.primaryAttachment', 'related_translation_primaryAttachment')
        .leftJoinAndSelect('related_translation.secondaryAttachment', 'related_translation_secondaryAttachment');
    }

    this._filterByViewed(dto, query, me.id);

    if (dto.randomNumber) this._fetchPostsInRandom(query, dto);

    if (dto.orderBy) this._postOrderBy(query, dto.orderBy, dto.sortType);

    query.take(dto.take);
    query.skip(dto.skip);

    const [data, total] = await query.getManyAndCount();

    const translatedData: Post[] = data.map((post) => {
      post.relatedPosts?.map((relatedPost) => setPostParams(relatedPost, contentLanguageCode, i18n));
      return setPostParams(post, contentLanguageCode, i18n);
    });

    return new Pagination<Post>(translatedData, total);
  }

  async likeDislike(id: string, user: User, i18n: I18nContext, like?: boolean, disliked?: boolean) {
    let found = await this._findUserPosts(user.id, id);
    if (!found) {
      found = this.userPostRepo.create({
        post: { id: id },
        user: { id: user.id },
      });
    }

    found.liked = like ?? false;
    found.disliked = disliked ?? false;
    await this.userPostRepo.save(found);
    return this.findOne(id, user, i18n);
  }

  _findUserPosts(userId: string, postId: string): Promise<UserPost> {
    return this.userPostRepo.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });
  }

  async viewed(id: string, user: User, i18n: I18nContext) {
    // let found = await this._findUserPosts(user.id, id);
    //
    // if (!found) {
    //   found = this.userPostRepo.create({
    //     views: 1,
    //     post: { id: id },
    //     user: { id: user.id },
    //   });
    // } else {
    //   found.views++;
    // }
    //
    // await this.userPostRepo.save(found);
    await this.postRepo.increment({ id: id }, 'views', 1);
    return this.findOne(id, user, i18n);
  }

  async findOne(id: string, user: User, i18n: I18nContext) {
    const languageCode = getSupportedLanguageCode(i18n?.lang, user.languageCode);
    const post = await this.postRepo.findOne({
      where: { id },
      relations: {
        tagPosts: { tag: true },
        postCategories: { category: true },
        translations: {
          attachmentPosts: { attachment: true },
          primaryAttachment: true,
          secondaryAttachment: true,
        },
      },
    });
    if (!post) throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));

    // check if liked & disliked by user to added in assets response
    if (user) await this._setPostUserParams(user, post);
    setPostParams(post, languageCode, i18n);
    post.relatedPosts?.forEach((relatedPost) => setPostParams(relatedPost, languageCode, i18n));

    return post;
  }

  async _setPostUserParams(user: User, post: Post) {
    let found = await this._findUserPosts(user.id, post.id);
    post.likedByMe = found?.liked ?? false;
    post.disLikedByMe = found?.disliked ?? false;
    post.viewsByMe = found?.views ?? 0;
    post.viewedByMe = found?.viewed ?? false;
  }

  async update(id: string, dto: UpdatePostDto, me: User, i18n: I18nContext) {
    const {
      name,
      type,
      tags,
      categories,
      relatedPosts,
      contentType,
      alwaysVisible,
      publishedAt,
      unpublishedAt,
      isPremium,
      subjectType,
      translations,
      visible,
      key,
    } = dto;

    const updateResult = await this.postRepo.update(
      { id },
      {
        name,
        type,
        contentType,
        publishedAt,
        unpublishedAt,
        alwaysVisible,
        isPremium,
        subjectType,
        key,
        visible,
      },
    );

    if (!updateResult.affected) throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));

    const post = await this.findOne(id, me, i18n);

    if (tags) post.tagPosts = await this._saveTagPost(id, tags, true);
    if (categories) post.postCategories = await this._savePostCategory(id, categories, true);
    if (relatedPosts) post.postRelatedPosts = await this._saveRelatedPost(post.id, relatedPosts, true);
    if (translations) post.translations = await this.savePostTranslation(translations, post.id, true);

    await this.postRepo.save(post);
    return this.findOne(post.id, me, i18n);
  }

  async remove(id: string) {
    const result = await this.postRepo.softDelete(id);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));
    }
  }

  async restore(id: string) {
    const result = await this.postRepo.restore(id);
    if (result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));
    }
  }

  async share(id: string, i18n: I18nContext, user?: User) {
    const post = await this.findOne(id, user, i18n);
    if (!post) throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));

    return this.shareService.createShareLink(post.route, post.primaryAttachmentUrl);
  }

  async notifyLater(id: string, i18n: I18nContext, user: User) {
    const post = await this.findOne(id, user, i18n);
    const notificationId = Constant.getIdNumber();
    const now = new Date();

    const data = {
      content: {
        id: notificationId,
        channelKey: NotificationChannelKey.CHANNEL_BASIC,
        displayOnForeground: true,
        showWhen: true,
        autoDismissible: true,
        privacy: 'Private',
        bigPicture: post.primaryAttachmentUrl,
        payload: {
          postId: post.id,
        },
      },
      schedule: {
        // getMonth started with 0 January
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        day: now.getDate() + 1,
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        timeZone: Constant.TIME_ZONE,
      },
    };
    const notification: NotificationDto = {
      title: i18n.t('locale.notification_title_notify_me', {
        args: { postTitle: post.title },
      }),
      body: post.description
        ? i18n.t('locale.notification_body_notify_me', {
            args: { postDescription: post.description },
          })
        : i18n.t('locale.notification_body_notify_me_default'),
    };
    return this.notificationsService.pushNotification(
      {
        userId: user.id,
        type: NotificationType.INFO,
        notification: notification,
        data: data,
      },
      true,
    );
    // this.notifyLaterQueue.add(
    //   'notify_me_later',
    //   {
    //     notification: notification,
    //     userId: user.id,
    //     data: data,
    //   },
    //   { jobId: uuid(), delay: Constant.POST_SCHEDULE_IN_MILLISECONDS },
    // );
  }

  async createTranslation(id: string, dto: CreatePostTranslationDto, i18n: I18nContext, me: User) {
    let { title, description, html, externalUrl, attachments, primaryAttachment, secondaryAttachment, languageCode } =
      dto;

    if (primaryAttachment) {
      primaryAttachment = await this.attachmentsService.checkAttachmentExistOrFail(primaryAttachment.id);
    }

    if (secondaryAttachment) {
      secondaryAttachment = await this.attachmentsService.checkAttachmentExistOrFail(secondaryAttachment.id);
    }

    let postTranslation = this.postTranslationRepo.create({
      title,
      description,
      html,
      externalUrl,
      languageCode,
      primaryAttachment: primaryAttachment,
      secondaryAttachment: secondaryAttachment,
      baseId: id,
    });

    try {
      postTranslation = await this.postTranslationRepo.save(postTranslation);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(new AppError(ERR_POST_TRANSLATION_ALREADY_EXIST, { postId: id, languageCode }));
      }
      rethrow(e);
    }

    if (attachments)
      postTranslation.attachmentPosts = await this._saveAttachmentsPost(postTranslation.id, attachments, true);

    // await this._handleCreatedPostPushNotification(i18n, saved);
    return this.findOneTranslation(postTranslation.id, me);
  }

  async updateTranslation(postTranslationId: string, dto: UpdatePostTranslationDto, me: User, i18n: I18nContext) {
    let {
      title,
      description,
      primaryAttachment,
      secondaryAttachment,
      attachments,
      externalUrl,
      quillData,
      html,
      languageCode,
    } = dto;
    if (primaryAttachment) {
      primaryAttachment = await this.attachmentsService.checkAttachmentExistOrFail(primaryAttachment.id);
    }
    if (secondaryAttachment) {
      secondaryAttachment = await this.attachmentsService.checkAttachmentExistOrFail(secondaryAttachment.id);
    }
    const result = await this.postTranslationRepo.update(
      { id: postTranslationId },
      {
        title,
        description,
        primaryAttachment,
        secondaryAttachment,
        externalUrl,
        html,
        quillData,
        languageCode,
      },
    );
    if (result.affected == null || result.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));
    }
    const postTranslation = await this.findOneTranslation(postTranslationId, me);

    if (attachments)
      postTranslation.attachmentPosts = await this._saveAttachmentsPost(postTranslationId, attachments, true);

    // await this.postRepo.save(post);
    // return this.findOne(post.id, me);
    return this.findOneTranslation(postTranslationId, me);
  }

  async findOneTranslation(id: string, user: User) {
    const postTranslation = await this.postTranslationRepo.findOne({
      where: { id },
      relations: {
        attachmentPosts: { attachment: true },
        primaryAttachment: true,
        secondaryAttachment: true,
      },
      order: {
        attachmentPosts: {
          orderIndex: 'ASC',
        },
      },
    });
    if (!postTranslation) throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));

    return postTranslation;
  }

  async findOneByKey(key: string, user: User, i18n?: I18nContext) {
    const languageCode = getSupportedLanguageCode(i18n?.lang, user.languageCode);
    const post = await this.postRepo.findOne({
      where: { key: key },
      relations: {
        tagPosts: { tag: true },
        postCategories: { category: true },
        translations: { attachmentPosts: { attachment: true }, primaryAttachment: true, secondaryAttachment: true },
        postRelatedPosts: {
          related: {
            translations: {
              attachmentPosts: { attachment: true },
              primaryAttachment: true,
              secondaryAttachment: true,
            },
          },
        },

        // userPosts: true,
      },
    });
    if (!post) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_POST));
    }

    // check if liked & disliked by user to added in assets response
    if (user) await this._setPostUserParams(user, post);
    setPostParams(post, languageCode, i18n);
    post.relatedPosts?.map((relatedPost) => setPostParams(relatedPost, languageCode, i18n));
    return post;
  }

  async updateCategoryByTagId(tagId: string, categoryId: string, me: User) {
    const posts = await this.postRepo.find({ where: { tagPosts: { tagId } }, relations: { tagPosts: true } });

    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });

    let postCategories = posts.map((post) => {
      return this.postCategoryRepo.create({
        category,
        postId: post.id,
      });
    });
    return await this.postCategoryRepo.save(postCategories);
  }

  private _fetchPostsInRandom(query: SelectQueryBuilder<Post>, dto: FilterPostDto): void {
    query.addSelect(`RAND(${dto.randomNumber})`, 'random_order').addOrderBy('random_order', dto.sortType);
  }

  private async _saveTagPost(postId: string, tags: Tag[], deletePrevious: boolean = false) {
    tags = await this._checkTagsExist(tags);

    if (deletePrevious) {
      await this.tagPostRepo.delete({
        postId: postId,
      });
    }

    let tagPosts = tags.map((tag) => {
      return this.tagPostRepo.create({
        tag,
        postId,
      });
    });
    return await this.tagPostRepo.save(tagPosts);
  }

  private async _savePostCategory(postId: string, categories: Category[], deletePrevious: boolean = false) {
    categories = await this._checkCategoriesExist(categories);

    if (deletePrevious) {
      await this.postCategoryRepo.delete({
        postId: postId,
      });
    }

    let postCategories = categories.map((category) => {
      return this.postCategoryRepo.create({
        category,
        postId,
      });
    });
    return await this.postCategoryRepo.save(postCategories);
  }

  private async _saveAttachmentsPost(
    postTranslationId: string,
    attachments: Attachment[],
    deletePrevious: boolean = false,
  ) {
    const foundedAttachments = await this.attachmentsService.checkAttachmentsExist(attachments);

    if (deletePrevious) {
      await this.attachmentPostRepo.delete({
        postTranslationId,
      });
    }

    const attachmentPosts = this._getAttachmentPostByAttachments(foundedAttachments, postTranslationId);
    return this.attachmentPostRepo.save(attachmentPosts);
  }

  private async _saveRelatedPost(
    postId: string,
    relatedPosts: Post[],
    deletePrevious: boolean = false,
  ): Promise<PostRelatedPost[]> {
    const foundedRelatedPosts = await this._checkPostsExist(relatedPosts);
    const result: PostRelatedPost[] = [];

    if (deletePrevious) {
      await this.relatedPostRepo.delete({
        postId,
      });
    }

    foundedRelatedPosts.forEach((related, index) => {
      let relatedPost = this.relatedPostRepo.create({
        postId,
        related: related,
        orderIndex: index,
      });
      result.push(relatedPost);
    });
    return this.relatedPostRepo.save(result);
  }

  private async _checkTagsExist(tags?: Tag[]) {
    if (!tags) return [];
    const ids = tags?.map((value) => value.id);
    const foundedTags = await this.tagRepo.findBy({ id: In(ids) });
    if (foundedTags.length != tags.length) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TAG));
    }
    return foundedTags;
  }

  private async _checkCategoriesExist(categories?: Category[]) {
    if (!categories) return [];
    const ids = categories?.map((value) => value.id);
    const foundedCategories = await this.categoryRepo.findBy({ id: In(ids) });
    if (foundedCategories.length != categories.length) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_CATEGORY));
    }
    return foundedCategories;
  }

  // private async _handleCreatedPostPushNotification(i18n: I18nContext, post: Post) {
  //   const notification: NotificationDto = {
  //     title: i18n.t('locale.notification_title_create_new_post'),
  //     body: i18n.t('locale.notification_body_create_new_post', {
  //       args: {
  //         title: post.description,
  //       },
  //     }),
  //     imageUrl: post.primaryAttachmentUrl,
  //   };
  //
  //   const type = NotificationType.CREATE_NEW_POST;
  //   const data: NotificationDataDto = {
  //     content: new NotificationContentDto({
  //       payload: {
  //         postId: post.id,
  //         notificationType: type,
  //       },
  //       bigPicture: post.primaryAttachmentUrl,
  //     }),
  //   };
  //   this.notificationsService.pushNotification(
  //     {
  //       notification,
  //       type,
  //       data,
  //     },
  //     false,
  //     true,
  //   );
  // }

  private _filterByViewed(dto: FilterPostDto, query: SelectQueryBuilder<Post>, userId: string) {
    if (dto.viewed != null) {
      query.leftJoinAndSelect('post.userPosts', 'userPost');
      switch (dto.viewed) {
        case true:
          query.andWhere('userPost.userId= :userId AND userPost.views > :views', { views: 0, userId: userId });
          break;
        case false:
          query.andWhere((qb) => {
            const subQuery = qb
              .subQuery()
              .from(UserPost, 'userPost')
              .where('userPost.postId = post.id')
              .andWhere('userPost.userId = :userId AND userPost.views != :views', { views: 0, userId })
              .getQuery();
            return `NOT EXISTS ${subQuery}`;
          });
          break;
      }
    }
  }

  private filterByDates(startDate: Date, endDate: Date, query: SelectQueryBuilder<Post>) {
    if (startDate > endDate) {
      throw new ConflictException(new AppError(ERR_START_DATE_BIGGER_THAN_END_DATE));
    }

    query.andWhere(
      () => `CASE
          WHEN (post.alwaysVisible = 0) AND (post.publishedAt IS NOT NULL) AND (post.unpublishedAt IS NOT NULL)
              THEN post.publishedAt >= :startDate AND post.unpublishedAt <= :endDate
          WHEN (post.alwaysVisible = 0) AND (post.publishedAt IS NOT NULL) AND (post.unpublishedAt IS NULL)
              THEN post.publishedAt BETWEEN :startDate AND :endDate
          ELSE 1=1 
          END
      `,
      {
        startDate,
        endDate,
      },
    );
  }

  private _postOrderBy(query: SelectQueryBuilder<Post>, orderBy: PostOrderBy, sortType: SortType) {
    switch (orderBy) {
      case PostOrderBy.UPDATED_AT:
        query.addOrderBy(`${query.alias}.updatedAt`, sortType);
        break;
      case PostOrderBy.CREATED_AT:
        query.addOrderBy(`${query.alias}.createdAt`, sortType);
        break;
      case PostOrderBy.VIEWS:
        query.addOrderBy(`${query.alias}.views`, sortType);
        break;
      case PostOrderBy.PUBLISHED_AT:
        query.addOrderBy(`${query.alias}.publishedAt`, sortType);
        break;
      default:
        break;
    }
  }
}
