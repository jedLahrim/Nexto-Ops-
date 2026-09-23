import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserType } from '../enums/user-type.enum';
import { RegisterProviderType } from '../dto/social-login.dto';
import { Attachment } from '../../attachments/entities/attachment.entity';
import { Exclude, Expose } from 'class-transformer';
import { UserPost } from '../../posts/entities/user-post.entity';
import { Faq } from '../../faqs/entities/faq.entity';
import { UserPermissionsType } from '../enums/user-permission.enum';
import { UserTutorial } from '../../tutorials/entities/user-tutorial.entity';
import { FcmDevice } from '../../notifications/entities/fcm-device.entity';
import { FcmSubscribedTopic } from '../../notifications/entities/fcm-subscribed-topic.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { isEmpty, last } from 'lodash';
import { AiInsight } from '../../ai/categories/ai-insights/entities/ai-insight.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import * as md5 from 'md5';
import { LanguageCode } from '../enums/language-code';
import { Suggestion } from 'src/suggestions/entities/suggestion.entity';
import { OnBoardingStep } from '../enums/onboarding-step.enum';
import { Task } from '../../task/entities/task.entity';
import { Constant } from '../../commons/constant';
import { Mood } from '../../moods/entities/mood.entity';
import { UserChallenge } from '../../challenges/entities/user-challenge.entity';
import { Entry } from '../../entries/entities/entry.entity';
import { Streak } from '../../streaks/entities/streak.entity';

export class UserStatistics {
  totalEntry?: number;
  totalEntryWords?: number;
  lastEntryLetters?: number;
  trackedDays?: number;
  totalInsights?: number;
  lastTrackedDayAt?: Date;
  lastEntryDayAt?: Date;
  streakDays?: number;
  lastStreakAt?: Date;
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  mailingId?: number;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ unique: true, nullable: true })
  guestEmail?: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  @Index()
  appleId?: string;

  @Column({ nullable: true })
  isApplePrivateEmail?: boolean;

  @Column()
  type: UserType;

  @Column({ default: false })
  isDemo: boolean;

  @Column({ default: false })
  isDeveloper: boolean;

  @Column({ default: false })
  isTeamMember: boolean;

  @Column({ default: false })
  isVip: boolean;

  @Column({ default: false })
  allowSkipCache: boolean;

  @Column({ default: true })
  allowNotifications: boolean;

  @Column({ default: true })
  allowEmails: boolean;

  @Column({ nullable: true })
  registerProviderType?: RegisterProviderType;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  countryName?: string;
  @Column({ nullable: true })
  countryCode?: string;

  @Column({ default: LanguageCode.EN })
  languageCode: LanguageCode;

  @Column({ default: LanguageCode.EN })
  contentLanguageCode: LanguageCode;

  @Exclude()
  @OneToOne(() => Attachment, (attachment) => attachment.user, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  profileImageAttachment?: Attachment;

  @OneToMany(() => Attachment, (attachment) => attachment.uploadedBy)
  uploadedAttachments: Attachment[];

  @Column({ default: false })
  activated: boolean;
  access: string;
  refresh: string;
  refreshExpireAt: Date;
  accessExpireAt: Date;

  @Column({ type: 'simple-array', select: false })
  permissions?: UserPermissionsType[];

  @OneToMany(() => UserPost, (userPost) => userPost.user)
  userPosts: UserPost[];

  @OneToMany(() => Suggestion, (suggestion) => suggestion.user)
  @Exclude()
  suggestions: Suggestion[];

  @OneToMany(() => UserTutorial, (userTutorial) => userTutorial.tutorial)
  @Exclude()
  userTutorials: UserTutorial[];
  @OneToMany(() => Faq, (faq) => faq.user)
  @Exclude()
  faqs: Faq[];
  @OneToMany(() => FcmDevice, (fcmDevice) => fcmDevice.user)
  fcmDevices: FcmDevice[];

  @OneToMany(() => FcmSubscribedTopic, (fcmSubscribedTopic) => fcmSubscribedTopic.user, { eager: true })
  fcmSubscribedTopics: FcmSubscribedTopic[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @Column('simple-json', { nullable: true })
  extraData: Record<string, unknown>;

  @Column('simple-json', { nullable: true })
  onboardingData: Record<string, any>;

  // to know each user which root come from
  // example ROOT_UUID/CHILD_UUID/SUB_CHILD_UUID/
  @Column({ nullable: true, length: 512 })
  @Index()
  nodeTree?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  firstLoginAt?: Date;

  @Column({ default: true })
  isFirstLogin: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  birthdayAt?: Date;

  @Column({ type: 'simple-json', nullable: true })
  statistics?: UserStatistics;

  @Column({ nullable: true })
  onBoardingStep?: OnBoardingStep;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ nullable: true })
  utcOffset?: string;

  @ManyToOne(() => User, (user) => user.childrenNodes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  parentNode?: User;

  @Column({ nullable: true })
  @Index()
  parentNodeId?: string;

  @Exclude()
  @OneToMany(() => User, (user) => user.parentNode)
  childrenNodes?: User[];

  @OneToMany(() => AiInsight, (aiInsight) => aiInsight.user)
  aiInsights?: AiInsight[];

  @OneToMany(() => Subscription, (subscription) => subscription.user, { cascade: false })
  subscriptions: Subscription[];

  @OneToMany(() => Mood, (mood) => mood.user)
  moods?: Mood[];

  @Exclude()
  @OneToMany(() => UserChallenge, (userChallenge) => userChallenge.user)
  userChallenges: UserChallenge[];

  // put default as 100 mean version 1.0.0 so we can detect which have version 2.0.0 to only push email marketing to
  // old users
  @Column({ default: 100 })
  appVersion: number;

  @Column({ default: 1 })
  onboardingVersion: number;

  @Column({ default: false })
  isGuest: boolean;

  @OneToMany(() => Task, (task) => task.createdBy)
  tasks: Task[];

  @OneToMany(() => Entry, (entry) => entry.user)
  entries?: Entry[];

  @OneToMany(() => Streak, (streak) => streak.createdBy)
  streaks?: Streak[];

  @Expose({ name: 'profileImageUrl' })
  get profileImageUrl(): string {
    return this.profileImageAttachment?.url;
  }

  get debug() {
    return this.isDeveloper || this.isDemo;
  }

  get nodes(): string[] {
    return this.nodeTree?.split('/').filter((value) => !isEmpty(value)) ?? [];
  }

  get parentId(): string {
    return last(this.nodes);
  }

  get rootId(): string {
    // second node cuz first one is for SenLife Super User
    return this.isRoot ? this.id : this.nodes[0];
  }

  // is Root of the organisation
  // is Root of the app
  get isRootOrg(): boolean {
    return this.nodes.length == 1;
  }

  // is Root of the app
  get isRoot(): boolean {
    return this.type == UserType.SUPER_USER;
  }

  get isAppTeamMembers(): boolean {
    const teamMembersUserTypes = [
      UserType.SUPER_USER,
      UserType.APP_ORGANIZATION,
      UserType.APP_MANAGER,
      UserType.APP_WORKER,
    ];
    return teamMembersUserTypes.includes(this.type);
  }

  get firstName(): string {
    return this.fullName?.split(' ')[0] ?? null;
  }

  get lastName(): string {
    if (this.fullName && this.fullName.split(' ').length > 1) {
      return this.fullName.split(' ')[1];
    } else {
      return null;
    }
  }

  hasPermission(permission: UserPermissionsType): boolean {
    return this.permissions?.includes(permission) ?? false;
  }

  hasPermissions(ps: UserPermissionsType[] = []): boolean {
    return ps.every((p) => this.hasPermission(p));
  }

  isDescendantOf(userId: string): boolean {
    return this.nodes?.includes(userId) ?? false;
  }

  isMe(userId: string): boolean {
    return this.id == userId;
  }

  isAncestorUserTypeOf(userType: UserType): boolean {
    const enumValues = Object.values(UserType);
    return enumValues.indexOf(this.type) < enumValues.indexOf(userType);
  }

  hasSubscriptionActive(entitlementId: string): boolean {
    let founded =
      this.subscriptions?.find((element) => element.entitlementId == entitlementId && element.active) ?? null;
    return founded != null;
  }

  subscriberHash(): string {
    return md5(this.email);
  }

  isPremium(): boolean {
    return this.isVip || this.hasSubscriptionActive(Constant.PLUS_ENTITLEMENT_ID);
  }
}
