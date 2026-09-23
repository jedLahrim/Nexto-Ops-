import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { UserPermissionsType } from 'src/user/enums/user-permission.enum';
import { GetUser } from 'src/user/get-user.decorator';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/user/guards/permission.guard';
import { FilterEntryDto } from './dto/filter-entry.dto';
import { User } from 'src/user/entities/user.entity';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_ENTRY))
  create(@Body() dto: CreateEntryDto, @GetUser() me: User) {
    return this.entriesService.create(dto, me);
  }

  @Get()
  // @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_ENTRY))
  findAll(@Query() dto: FilterEntryDto, @GetUser() me: User) {
    return this.entriesService.findAll(dto, me);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/execute/:useCaseId')
  execute(@Param('id') id: string, @Param('useCaseId') useCaseId: string, @GetUser() me: User) {
    return this.entriesService.executeEntry(id, useCaseId, me);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_ENTRY))
  findOne(@Param('id') id: string, @GetUser() me: User) {
    return this.entriesService.findOne(id, me);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_ENTRY))
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto, @GetUser() me: User) {
    return this.entriesService.update(id, dto, me);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_ENTRY))
  remove(@Param('id') id: string, @GetUser() me: User) {
    return this.entriesService.remove(id, me);
  }

  // TODO:
  // API Upload attachment (enableInstantTranscription) + wait for transcription if voice
  // API Create entry
  // API Execute Entry (entryId+useCaseId) -> return Full Entry with AI data
  //

  // execute function for entry entryId, useCaseId, ExecuteEntryDto
}
