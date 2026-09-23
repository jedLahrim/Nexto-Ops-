import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from '../user/entities/user.entity';
import { Task, TaskStatus, TaskType } from './entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { isEmpty } from 'lodash';
import { AppError } from '../commons/errors/app-error';
import { ERR_NOT_FOUND_TASK } from '../commons/errors/errors-codes';
import { Pagination } from '../commons/pagination/pagination';
import { TaskFilterDto, TaskOrderBy } from './dto/task-filter.dto';
import { SortType } from '../commons/enums/sortType';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PermissionService } from '../permission/permission.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExecuteUseCaseEvent } from '../event-listeners/events/execute-use-case.event';
import { SetFocusDto } from './dto/set-focus.dto';
import * as moment from 'moment';
import { Constant } from '../commons/constant';
import { TimelineType } from '../ai/categories/use-cases/dto/use-case-meta-data.dto';
import { UseCase } from '../ai/categories/use-cases/entities/use-case.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EntryExecutedEvent } from '../event-listeners/events/entry-executed.event';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(UseCase) private useCaseRepo: Repository<UseCase>,
    private permissionService: PermissionService,
    private eventEmitter: EventEmitter2,
    @InjectQueue(Constant.MEMBER_QUEUE)
    private memberQueue: Queue,
  ) {}

  async create(dto: CreateTaskDto, me: User): Promise<Task> {
    const {
      isMainTask,
      skippable,
      parentTaskId,
      subTasks,
      type,
      status,
      name,
      enableWhenAllSiblingTasksCompleted,
      completedWhenAllSubTasksCompleted,
      schemaKey,
      nextSchemaKey,
      generateSubtaskBasedOnTaskType,
      predefinedTrackingCount,
      recurringCount,
      localeKey,
      dueDateAt,
      extraData,
    } = dto;
    const createdById = me.id;

    let task = this.taskRepo.create({
      createdById,
      skippable,
      isMainTask: isMainTask ?? true,
      parentTaskId,
      type: type,
      status,
      name,
      enableWhenAllSiblingTasksCompleted,
      completedWhenAllSubTasksCompleted,
      schemaKey,
      nextSchemaKey,
      generateSubtaskBasedOnTaskType,
      predefinedTrackingCount,
      recurringCount,
      localeKey,
      dueDateAt,
      extraData,
    });

    task = await this.taskRepo.save(task);
    task = await this.findOneOrFail(task.id);

    if (generateSubtaskBasedOnTaskType) {
      task.subTasks = this._getSubTasksByTaskType(createdById, task, dto);
    } else if (!isEmpty(dto.subTasks)) {
      task.subTasks = this._getSubTasksByDto(createdById, dto.subTasks);
    }

    task = await this.taskRepo.save(task);

    return this.findOneOrFail(task.id);
  }

  async findAll(dto: TaskFilterDto, me: User): Promise<Pagination<Task>> {
    let { take, skip, orderBy, sortType } = dto;
    const query = this.taskRepo.createQueryBuilder('task');

    query.where('task.userId=:userId', { userId: me.id });

    this._orderBy(query, orderBy, sortType);
    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<Task>(data, total);
  }

  async findOneOrFail(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: id },
      relations: {
        createdBy: true,
        subTasks: true,
      },
      order: { createdAt: 'ASC', subTasks: { orderIndex: 'ASC' } },
    });
    if (!task) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TASK));
    } else {
      return task;
    }
  }

  async findCurrentMainOne(userId: string): Promise<Task> {
    const taskBeforeNotCompletedYet = await this.taskRepo.findOne({
      where: { isMainTask: true, createdById: userId, status: Not(TaskStatus.COMPLETED) },
      relations: {
        createdBy: true,
        subTasks: true,
      },
      order: { createdAt: 'ASC', subTasks: { orderIndex: 'ASC' } },
    });
    if (taskBeforeNotCompletedYet) return taskBeforeNotCompletedYet;

    const task = await this.taskRepo.findOne({
      where: { isMainTask: true, createdById: userId },
      relations: {
        createdBy: true,
        subTasks: true,
      },
      order: { createdAt: 'DESC', subTasks: { orderIndex: 'ASC' } },
    });
    if (!task) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TASK));
    } else {
      return task;
    }
  }

  async update(id: string, dto: UpdateTaskDto, me: User): Promise<Task> {
    const {
      isMainTask,
      skippable,
      parentTaskId,
      type,
      status,
      name,
      enableWhenAllSiblingTasksCompleted,
      completedWhenAllSubTasksCompleted,
      nextSchemaKey,
      schemaKey,
      generateSubtaskBasedOnTaskType,
      predefinedTrackingCount,
      recurringCount,
      localeKey,
      dueDateAt,
      extraData,
    } = dto;

    const task = await this.findOneOrFail(id);
    let subTasks;
    if (dto.subTasks) {
      await this.taskRepo.delete({
        parentTaskId: task.id,
      });

      subTasks = this._getSubTasksByDto(me.id, dto.subTasks);
    }
    const result = await this.taskRepo.save({
      id,
      isMainTask,
      skippable,
      parentTaskId,
      type,
      status,
      name,
      userId: me.id,
      subTasks,
      enableWhenAllSiblingTasksCompleted,
      completedWhenAllSubTasksCompleted,
      schemaKey,
      nextSchemaKey,
      generateSubtaskBasedOnTaskType,
      predefinedTrackingCount,
      recurringCount,
      localeKey,
      dueDateAt,
      extraData,
    });
    // if (result.affected == null || result.affected == 0) {
    //   throw new NotFoundException(new AppError(ERR_NOT_FOUND_TASK));
    // }
    return await this.findOneOrFail(id);
  }

  remove(id: string) {
    return `This action removes a #${id} task`;
  }

  private _getSubTasksByDto(createdById: string, subTasksDtos: CreateTaskDto[]) {
    return subTasksDtos.map((dto, index) => {
      const task: Task = this.taskRepo.create({
        createdById: createdById,
        isMainTask: dto.isMainTask ?? false,
        skippable: dto.skippable,
        extraData: dto.extraData,
        type: dto.type,
        status: dto.status,
        name: dto.name,
        orderIndex: index,
        enableWhenAllSiblingTasksCompleted: dto.enableWhenAllSiblingTasksCompleted,
        completedWhenAllSubTasksCompleted: dto.completedWhenAllSubTasksCompleted,
        recurringCount: dto.recurringCount,
        generateSubtaskBasedOnTaskType: dto.generateSubtaskBasedOnTaskType,
        predefinedTrackingCount: dto.predefinedTrackingCount,
        dueDateAt: dto.dueDateAt,
      });

      if (!isEmpty(dto.subTasks)) {
        task.subTasks = this._getSubTasksByDto(createdById, dto.subTasks);
      }

      return task;
    });
  }

  private _orderBy(query: SelectQueryBuilder<Task>, orderBy: TaskOrderBy, sortType: SortType) {
    switch (orderBy) {
      case TaskOrderBy.UPDATED_AT:
        query.orderBy(`${query.alias}.updatedAt`, sortType);
        break;
      case TaskOrderBy.CREATED_AT:
        query.orderBy(`${query.alias}.createdAt`, sortType);
        break;
      case TaskOrderBy.NAME:
        query.orderBy(`${query.alias}.name`, sortType);
    }
  }

  private _getSubTasksByTaskType(createdById: string, task: Task, dto: CreateTaskDto) {
    switch (dto.type) {
      case TaskType.GENERAL:
        break;
      case TaskType.OBJECTIVE:
        break;
      case TaskType.FOCUS_INSIGHT:
        return this._getSubTaskOfFocusInsights(createdById, task, dto);
      case TaskType.ADD_TRACK:
        break;
    }
    return [];
  }

  private _getSubTaskOfFocusInsights(createdById: string, task: Task, dto: CreateTaskDto) {
    const subTaskDtos = [];
    let count = task.requiredTrackingCount;
    for (let i = 0; i < count; i++) {
      const subTaskDto = new CreateTaskDto({
        name: 'Add Track',
        type: TaskType.ADD_TRACK,
        isMainTask: false,
        // parentTaskId: task.id,
      });
      subTaskDtos.push(subTaskDto);
    }
    return this._getSubTasksByDto(createdById, subTaskDtos);
  }

  async handleObjectiveEntryCreated(event: EntryExecutedEvent) {
    try {
      const task = await this.findCurrentMainOne(event.createdBy.id);
      const { createdBy } = event;
      let allowHandleObjectiveTracking = true;
      const allowSameDay = createdBy.isTeamMember;
      if (!allowSameDay && !Constant.ALLOW_ENTRY_CREATED_BY_TRACKING_SAME_DAY && task.subTasks) {
        const founded = task.subTasks.find((value) => {
          let sameDay = value.completedAt ? moment(value.completedAt).isSame(moment(), 'day') : false;
          return value.status == TaskStatus.COMPLETED && sameDay;
        });
        allowHandleObjectiveTracking = founded == null;
      }

      if (allowHandleObjectiveTracking) await this._handleObjectiveTrackingCreatedByTaskType(event.createdBy, task);
    } catch (e) {}
  }

  private async _handleObjectiveTrackingCreatedByTaskType(user: User, task: Task) {
    switch (task.type) {
      case TaskType.OBJECTIVE:
        await this.markTasksAsStatus(task.subTasks, [TaskType.ADD_TRACK]);
        break;
      case TaskType.FOCUS_INSIGHT:
        await this._handleObjectiveFocusInsight(user, task);
        break;

      case TaskType.ADD_TRACK:
        await this._handleObjectiveAddTrack(user, task);
        break;
    }
  }

  async markTasksAsStatus(tasks: Task[], types?: TaskType[], status?: TaskStatus) {
    if (isEmpty(tasks)) return;
    const filteredTasks = types && !isEmpty(types) ? tasks.filter((value) => types.includes(value.type)) : tasks;
    const list = filteredTasks.map((task) => {
      task.status = status ?? TaskStatus.COMPLETED;
      return task;
    });
    const result = await this.taskRepo.save(list);
    console.log(result);
  }

  private async _handleObjectiveFocusInsight(user: User, task: Task) {
    switch (task.status) {
      case TaskStatus.IN_PROGRESS:
        // TODO: check if task have subtask if so
        //    check if sub task is ADD_TRACK
        //      if so put status to COMPLETED and check if all subtask is complete && main task has
        //      completedWhenAllSubTasksCompleted==true then put main task to complete else do nothing
        //      else do nothing
        //  `else do nothing
        // else do nothing
        if (isEmpty(task.subTasks)) {
          await this.markTasksAsStatus([task]);
        } else {
          const subTasks = task.subTasks;
          // task.subTasks = undefined;

          const founded = subTasks.find((value) => value.status != TaskStatus.COMPLETED);

          if (founded) {
            // exist a subtask no completed yet
            await this._handleObjectiveTrackingCreatedByTaskType(user, founded);
          } else {
            // all subtask already completed
            if (task.completedWhenAllSubTasksCompleted) await this.markTasksAsStatus([task]);
          }
        }

        break;
      case TaskStatus.TODO:
      case TaskStatus.COMPLETED:
        break;
    }
  }

  private async _handleObjectiveAddTrack(user: User, task: Task) {
    await this.markTasksAsStatus([task]);
    if (task.parentTaskId) {
      const parentTask = await this.findOneOrFail(task.parentTaskId);
      if (parentTask.subTasks.every((value) => value.status == TaskStatus.COMPLETED)) {
        const isAutomaticGeneration = parentTask.extraData?.['AUTOMATIC_GENERATION'] ?? true;
        // if (isAutomaticGeneration) this._handleExecuteUseCase(user, parentTask);
      }
    }
  }

  isTasksAllCompleted(tasks: Task[]) {
    return tasks.every((value) => value.status == TaskStatus.COMPLETED);
  }

  /*async handleObjectiveChildBehaviourDetailAdded(event: ChildBehaviourUpdatedEvent) {
    const task = await this.findCurrentMainOne(event.child.id);
    switch (task.type) {
      case TaskType.OBJECTIVE:
        // check if there is ADD_DETAILS_CHILD_BEHAVIOUR subtask to mark as completed
        await this.markTasksAsStatus(task.subTasks, [TaskType.ADD_DETAILS_CHILD_BEHAVIOUR]);
        if (task.completedWhenAllSubTasksCompleted && this.isTasksAllCompleted(task.subTasks))
          await this.markTasksAsStatus([task]);
        break;
      case TaskType.ADD_DETAILS_CHILD_BEHAVIOUR:
        await this.markTasksAsStatus([task]);
        break;
    }
  }*/

  private async _handleExecuteUseCase(createdBy: User, mainTask: Task) {
    if (mainTask.createdById) {
      const useCaseId = (await this.useCaseRepo.findOneOrFail({ where: { defaultInsight: true } })).id;
      const executeUseCaseEvent: ExecuteUseCaseEvent = {
        useCaseId: useCaseId,
        dto: {
          allowNotify: true,
          metaData: {
            usedUserData: {
              lastTimeline: {
                type: TimelineType.ALL_TIME,
              },
            },
          },
          userId: createdBy.id,
        },
        user: createdBy,
      };

      // await delay(200000)
      this.eventEmitter.emit('useCase.execute', executeUseCaseEvent);
      // await this.memberQueue.add(Constant.MEMBER_EXECUTE_INSIGHT_AFTER_20_SEC, executeUseCaseEvent, {
      //   jobId: `execute_insight_after20_sec${useCaseId}`,
      //   removeOnComplete: true,
      //   removeOnFail: true,
      //   attempts: 4,
      //   delay: toMs('20sec'),
      // });
    }
  }

  async setFocus(dto: SetFocusDto, me: User) {
    let task = await this.findCurrentMainOne(me.id);
    await this.taskRepo.update({ id: task.id }, { createdById: me.id });
    task = await this.findCurrentMainOne(me.id);

    switch (task.type) {
      case TaskType.OBJECTIVE:
        await this.markTasksAsStatus(task.subTasks, [TaskType.FOCUS_INSIGHT], TaskStatus.COMPLETED);
        if (task.completedWhenAllSubTasksCompleted && this.isTasksAllCompleted(task.subTasks))
          await this.markTasksAsStatus([task]);
        break;
      case TaskType.FOCUS_INSIGHT:
        if (task.status == TaskStatus.TODO) {
          // generate subTask as long set focus in TODO status
          const dto: CreateTaskDto = {
            completedWhenAllSubTasksCompleted: task.completedWhenAllSubTasksCompleted,
            generateSubtaskBasedOnTaskType: task.generateSubtaskBasedOnTaskType,
            name: task.name,
            type: task.type,
          };

          if (task.generateSubtaskBasedOnTaskType) {
            await this.taskRepo.delete({
              parentTaskId: task.id,
            });
            task.subTasks = this._getSubTasksByTaskType(me.id, task, dto);
          }

          task.status = TaskStatus.IN_PROGRESS;
        }
        break;
    }

    const saved = await this.taskRepo.save(task);
    return this.findOneOrFail(saved.id);
  }
}
