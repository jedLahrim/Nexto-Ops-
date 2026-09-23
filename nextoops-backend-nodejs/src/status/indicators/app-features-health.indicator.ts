import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

export enum AppFeatures {
  AI = 'ai',
  ALLERGIES = 'allergies',
  BEHAVIOURS_TRAITS = 'behavioursTraits',
  POST = 'partner',
  DAILY_NOTES = 'dailyNotes',
  DAILY_TRACKING = 'dailyNotes',
  MEDICATIONS = 'medications',
  EXPORT = 'export',
  MAIL = 'mail',
  SUSPECTED_CONDITIONS = 'suspectedConditions',
  NOTIFICATIONS = 'notifications',
  POSTS = 'posts',
  SHARING = 'sharing',
  TUTORIALS = 'tutorials',
}

@Injectable()
export class AppFeaturesHealthIndicator extends HealthIndicator {
  private featuresWorking: AppFeatures[] = [
    AppFeatures.AI,
    AppFeatures.ALLERGIES,
    AppFeatures.BEHAVIOURS_TRAITS,
    AppFeatures.POST,
    AppFeatures.DAILY_NOTES,
    AppFeatures.DAILY_TRACKING,
    AppFeatures.MEDICATIONS,
    AppFeatures.EXPORT,
    AppFeatures.MAIL,
    AppFeatures.SUSPECTED_CONDITIONS,
    AppFeatures.NOTIFICATIONS,
    AppFeatures.POSTS,
    AppFeatures.SHARING,
    AppFeatures.TUTORIALS,
  ];

  isHealthy(): HealthIndicatorResult[] {
    let result: HealthIndicatorResult[] = [];
    Object.values(AppFeatures).forEach((value) => {
      const isHealthy = this.featuresWorking.includes(value);
      result.push(this.getStatus(value, isHealthy));
    });
    return result;
  }
}
