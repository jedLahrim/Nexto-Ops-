import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../user/guards/jwt-auth.guard';
import { PermissionGuard } from '../user/guards/permission.guard';
import { UserPermissionsType } from '../user/enums/user-permission.enum';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { Task } from './entities/task.entity';
import { TaskFilterDto } from './dto/task-filter.dto';
import { SetFocusDto } from './dto/set-focus.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_TASK))
  async create(@Body() dto: CreateTaskDto, @GetUser() me: User) {
    return this.taskService.create(dto, me);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TASK))
  findAll(@Query() dto: TaskFilterDto, @GetUser() me: User) {
    return this.taskService.findAll(dto, me);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOneOrFail(id);
  }

  @Get('get/current')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_TASK))
  findCurrentMainOne(@GetUser() me: User) {
    return this.taskService.findCurrentMainOne(me.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_TASK))
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @GetUser() me: User) {
    return this.taskService.update(id, dto, me);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_TASK))
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  @Post('set-focus')
  @UseGuards(JwtAuthGuard)
  async setFocus(@Body() dto: SetFocusDto, @GetUser() user: User): Promise<Task> {
    return this.taskService.setFocus(dto, user);
  }
}
