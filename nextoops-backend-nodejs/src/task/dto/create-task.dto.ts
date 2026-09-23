import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TaskStatus, TaskType } from '../entities/task.entity';
import { TransformBoolean } from '../../commons/decorators/transform-boolean.decorator';
import { Type } from 'class-transformer';
import { TransformJson } from '../../commons/decorators/transform-json.decorator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  localeKey?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @TransformBoolean()
  isMainTask?: boolean;

  @IsOptional()
  @TransformBoolean()
  skippable?: boolean;

  @IsOptional()
  @IsString()
  parentTaskId?: string;

  @IsOptional()
  @IsString()
  schemaKey?: string;

  @IsOptional()
  @IsString()
  nextSchemaKey?: string;

  @IsOptional()
  @TransformBoolean()
  enableWhenAllSiblingTasksCompleted?: boolean;

  @IsOptional()
  @TransformBoolean({ defaultValue: false })
  generateSubtaskBasedOnTaskType: boolean = false;

  @IsOptional()
  @TransformBoolean({ defaultValue: true })
  completedWhenAllSubTasksCompleted: boolean = true;

  // @IsString()
  // createdById: string;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsDate()
  dueDateAt?: Date;

  @IsOptional()
  @IsNumber()
  predefinedTrackingCount?: number;

  @IsOptional()
  @IsNumber()
  recurringCount?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTaskDto)
  subTasks?: CreateTaskDto[];

  @IsOptional()
  @TransformJson
  extraData?: {};

  constructor(object?: Partial<CreateTaskDto>) {
    // this.notificationLayout = this.bigPicture ? NotificationLayout.BigPicture : NotificationLayout.Default;
    Object.assign(this, object);
  }
}
