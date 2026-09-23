import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exclude, Expose } from 'class-transformer';

export enum TaskType {
  GENERAL = 'GENERAL',
  OBJECTIVE = 'OBJECTIVE',
  FOCUS_INSIGHT = 'FOCUS_INSIGHT',
  SET_NEXT_FOCUS_INSIGHT = 'SET_NEXT_FOCUS_INSIGHT',
  ADD_TRACK = 'ADD_TRACK',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  localeKey?: string;

  @Column({ nullable: true })
  schemaKey?: string;

  @Column({ default: 0 })
  orderIndex?: number;

  @Column({ default: true })
  isMainTask: boolean;

  @Column({ default: false })
  skippable: boolean;

  @Column({ default: false })
  generateSubtaskBasedOnTaskType: boolean;

  @Column({ nullable: true })
  recurringCount?: number;

  @Column({ default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  statusChangedAt: Date;

  @Column({ nullable: true })
  dueDateAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt?: Date;

  // this will enable the task when all others task in same level are done
  @Column({ default: false })
  enableWhenAllSiblingTasksCompleted: boolean;

  @Column({ default: true })
  completedWhenAllSubTasksCompleted: boolean;

  @ManyToOne(() => User, (user) => user.tasks, {
    onDelete: 'CASCADE',
  })
  createdBy: User;

  @Column()
  createdById: string;

  @OneToMany(() => Task, (task) => task.parentTask, {
    // to have nested save
    cascade: true,
  })
  subTasks: Task[];

  @ManyToOne(() => Task, (task) => task.subTasks, {
    onDelete: 'CASCADE',
  })
  parentTask?: Task;

  @Column({ nullable: true })
  parentTaskId?: string;

  @Column({ nullable: true })
  type?: TaskType;

  // @ManyToOne(() => UseCase, (useCase) => useCase.tasks, {
  //   onDelete: 'CASCADE',
  // })
  // useCase?: UseCase;

  @Exclude()
  @Column({ nullable: true })
  predefinedTrackingCount?: number;

  @Column('simple-json', { nullable: true })
  extraData: Record<string, unknown>;

  @Expose({ name: 'requiredTrackingCount' })
  get requiredTrackingCount(): number {
    return this.predefinedTrackingCount;
  }

  @Column({ nullable: true })
  nextSchemaKey: string;

  @Expose({ name: 'isAllSubTaskCompleted' })
  get isAllSubTaskCompleted(): boolean {
    return this.subTasks?.every((value) => value.status == TaskStatus.COMPLETED) ?? false;
  }
}
