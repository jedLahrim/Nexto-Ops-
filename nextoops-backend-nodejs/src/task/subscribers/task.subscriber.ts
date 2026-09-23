import { DataSource, EntitySubscriberInterface, Not, Repository, UpdateEvent } from 'typeorm';
import { Task, TaskStatus } from '../entities/task.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TasksService } from '../tasks.service';

type MyCallback = (data?: any) => void;

@Injectable()
export class TaskSubscriber implements EntitySubscriberInterface<Task> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    private taskService: TasksService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  callbacks: MyCallback[] = [];

  listenTo() {
    return Task; // We're subscribing to the Task entity
  }

  async beforeUpdate(event: UpdateEvent<Task>) {
    if (event.updatedColumns.some((col) => col.propertyName === 'status')) {
      // The 'status' property has changed
      const task = event.databaseEntity;
      const newTask = event.entity as Task;
      const oldStatus = task.status;
      const newStatus = newTask.status;
      if (oldStatus != newStatus) {
        const now = new Date();
        event.entity.statusChangedAt = now;
        if (newStatus == TaskStatus.COMPLETED) {
          event.entity.completedAt = now;
          if (task.isMainTask) {
            this._setAllSubTaskAsCompletedIfPossible(task.id);
          } else if (task.parentTaskId != null) {
            this._setMainTaskAsCompletedIfPossible(task.id, task.parentTaskId);
          }
          //this.callbacks.push(() => this._setAllSubTaskAsCompletedIfPossible(task.id));
        } else {
          event.entity.completedAt = null;
        }
      }
    }
  }

  // async afterUpdate(event: UpdateEvent<Task>): Promise<any> {
  //   const task = event.entity as Task;
  //
  //   if (task.isMainTask && task.status == TaskStatus.COMPLETED) {
  //     this.callbacks.push(() => this._setAllSubTaskAsCompletedIfPossible(task.id));
  //   }
  // }

  // afterTransactionCommit(event: TransactionCommitEvent): Promise<any> | void {
  //   if (!isEmpty(this.callbacks)) {
  //     const functionAfterCommit = [...this.callbacks];
  //     this.callbacks.splice(0);
  //     functionAfterCommit.forEach((callback) => {
  //       // callback();
  //     });
  //   }
  // }

  private async _setAllSubTaskAsCompletedIfPossible(id: string) {
    // const subTasks = await this.taskRepo.find({ where: { parentTaskId: id } });
    // await this.taskService.markTasksAsStatus(subTasks);
    await this.taskRepo.update({ parentTaskId: id }, { status: TaskStatus.COMPLETED });
  }

  private async _setMainTaskAsCompletedIfPossible(id: string, parentTaskId: string) {
    const mainTask = await this.taskRepo.findOne({ where: { id: parentTaskId } });
    if (mainTask?.completedWhenAllSubTasksCompleted) {
      const subTasks = await this.taskRepo.find({ where: { parentTaskId, id: Not(id) } });
      const isAllSubTaskCompleted = subTasks.every((value) => value.status == TaskStatus.COMPLETED) ?? false;
      if (isAllSubTaskCompleted)
        await this.taskRepo.update(
          {
            id: parentTaskId,
          },
          { status: TaskStatus.COMPLETED },
        );
    }
  }
}
