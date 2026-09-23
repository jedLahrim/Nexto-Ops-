import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UseCasesService } from './use-cases.service';
import { CreateUseCaseDto } from './dto/create-use-case.dto';
import { UpdateUseCaseDto } from './dto/update-use-case.dto';
import { FilterUseCaseDto } from './dto/filter-use-case.dto';
import { CreateUseCaseTranslationDto } from './dto/create-use-case-translation.dto';
import { UpdateUseCaseTranslationDto } from './dto/update-use-case-translation.dto';
import { JwtAuthGuard } from '../../../user/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../user/guards/permission.guard';
import { UserPermissionsType } from '../../../user/enums/user-permission.enum';
import { ExecuteUseCaseDto, UserDataType } from './dto/execute-use-case.dto';
import { UseCase } from './entities/use-case.entity';
import { AiService } from '../../ai.service';
import { AppError } from '../../../commons/errors/app-error';
import {
  ERR_INGISHT_REQUIRE_TIMELINE_TO_EXECUTE,
  ERR_INGISHT_REQUIRE_USER_DATA_TYPE_TO_EXECUTE,
} from '../../../commons/errors/errors-codes';
import { getInsightAIModelByAIProvider, parseJsonResponse, Utils, validateWithSchema } from '../../../commons/utils';
import { isEmpty } from 'lodash';
import { User } from '../../../user/entities/user.entity';
import { UseCaseMetaData, UsedUserMetaData } from './dto/use-case-meta-data.dto';
import { CreateAiInsightDto } from '../ai-insights/dto/create-ai-insight.dto';
import { AiInsightsService } from '../ai-insights/ai-insights.service';
import { GetUser } from '../../../user/get-user.decorator';
import { AiInsight } from '../ai-insights/entities/ai-insight.entity';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';
import { CreateChatAIDto } from '../../dto/create-chat-a-i.dto';
import { ExportDataDto } from '../../../user/dto/export-data.dto';
import { EntriesService } from '../../../entries/entries.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterEntryDto } from '../../../entries/dto/filter-entry.dto';
import { CacheTTL } from '@nestjs/cache-manager';
import { Constant } from '../../../commons/constant';
import { CustomCacheInterceptor } from '../../../interceptors/custom-cache-inerceptor.interceptor';
import {
  TransformCacheResponseInterceptor
} from '../../../interceptors/transform-cache-response-interceptor.interceptor';

@Controller('ai/use-cases')
export class UseCasesController {
  constructor(
    private readonly useCasesService: UseCasesService,
    private readonly aiService: AiService,
    private readonly aiInsightsService: AiInsightsService,
    private readonly entriesService: EntriesService,
    private readonly i18nService: I18nService,
    @InjectRepository(UseCase) private readonly useCaseRepo: Repository<UseCase>,
    // private readonly entriesService: EntriesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_USE_CASE))
  create(@Body() dto: CreateUseCaseDto) {
    return this.useCasesService.create(dto);
  }

  @Post('many')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_USE_CASE))
  async createMany(@Body() dtos: CreateUseCaseDto[]) {
    // many creation not using transactions for now
    const useCases: UseCase[] = [];
    for (const dto of dtos) {
      const useCase = await this.useCasesService.create(dto);
      useCases.push(useCase);
    }
    return useCases;
  }

  @Get()
  @CacheTTL(Constant.CacheTTL())
  @UseInterceptors(CustomCacheInterceptor, TransformCacheResponseInterceptor)
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_USE_CASE))
  findAll(@Query() dto: FilterUseCaseDto, @GetUser() user: User, @I18n() i18n: I18nContext) {
    return this.useCasesService.findAll(dto, user, i18n);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_USE_CASE))
  findOne(@Param('id') id: string, @GetUser() user: User, @I18n() i18n: I18nContext) {
    return this.useCasesService.findOneOrFail(id, user, i18n);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_USE_CASE))
  update(@Param('id') id: string, @Body() dto: UpdateUseCaseDto, @GetUser() user: User, @I18n() i18n: I18nContext) {
    return this.useCasesService.update(id, dto, user, i18n);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_USE_CASE))
  remove(@Param('id') id: string) {
    return this.useCasesService.remove(id);
  }

  @Delete(':id/archive')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_DELETE_USE_CASE))
  archive(@Param('id') id: string) {
    return this.useCasesService.archive(id);
  }

  @Post(':id/execute')
  @UseGuards(JwtAuthGuard)
  async execute(
    @Param('id') id: string,
    @Body() dto: ExecuteUseCaseDto,
    @GetUser() user: User,
    @I18n() i18n: I18nContext,
  ): Promise<AiInsight> {
    // const useCaseId = id ?? (await this.useCaseRepo.findOneOrFail({ where: { defaultInsight: true } })).id;
    // const useCaseId = (await this.useCaseRepo.findOneOrFail({ where: { defaultInsight: true } })).id;
    return this.executeUseCase(id, dto, user, i18n);
  }

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  async executeDefaultInsight(
    @Body() dto: ExecuteUseCaseDto,
    @GetUser() user: User,
    @I18n() i18n: I18nContext,
  ): Promise<AiInsight> {
    console.log('executeDefaultInsight dto', dto);
    const useCaseId = (await this.useCaseRepo.findOneOrFail({ where: { defaultInsight: true } })).id;
    return this.executeUseCase(useCaseId, dto, user, i18n);
  }

  async executeUseCase(id: string, dto: ExecuteUseCaseDto, user: User, i18n?: I18nContext): Promise<AiInsight> {
    const useCase = await this.useCasesService.findOneOrFail(id, user, i18n);
    const aiProvider = dto.aiProvider ?? useCase.aiProvider;
    const model = getInsightAIModelByAIProvider(aiProvider);
    const metaData = this._getUseCaseMetaData(useCase, dto);
    console.log('metaData', metaData);
    const prompt = await this._getAIPrompt(useCase, dto, metaData, i18n, user);
    console.log('prompt', prompt);

    const createChatAIDto: CreateChatAIDto = {
      userId: user.id,
      model,
      aiProvider,
      jsonSchema: useCase.jsonSchema,
      // inputVariables: {
      //   '@childName': child.fullName,
      //   '@suspectedConditions': child.childNeuroDiverseConditions?.map((value) => value.name).join(', ') ?? '',
      //   '@behaviourTraits': child.childBehaviourTraits?.map((value) => value.name).join(', ') ?? '',
      // },
      /*outputVariables: {
        '[Current Date]': Utils.friendlyDate(new Date()),
        '[Name of Professional Creating Insight]': user.fullName,
      },*/
      // maxResponseLength: 2000,x
    };

    const result = await this.aiService.createChatCompletion(prompt, createChatAIDto);
    console.log('result', result);
    const parsed = validateWithSchema(parseJsonResponse(result), useCase.jsonSchema);

    const { question, description, shortText } = useCase;
    const lastTimeline = dto.metaData?.usedUserData?.lastTimeline;
    if (lastTimeline) {
      const startEndDates = Utils.getStartEndDateByTimeline(lastTimeline);
      dto.startDate = startEndDates.startDate;
      dto.endDate = startEndDates.endDate;
    }

    const createAiInsightDto: CreateAiInsightDto = {
      answer: result,
      question,
      description: parsed['insight'],
      shortText: parsed['title'],
      metaData: metaData,
      useCaseId: id,
      output: parsed,
      timeFrame: dto.timeFrame,
      timeFrameStartDate: dto.startDate,
      timeFrameEndDate: dto.endDate,

      // output: {
      //   insight: parsed.insight,
      //   whyItIsImportant: parsed.whyItIsImportant,
      //   tip: parsed.tip,
      // } ,
    };
    const aiInsight = await this.aiInsightsService.create(createAiInsightDto, user);
    if (dto.allowNotify) await this.aiInsightsService.notifyByUserId(aiInsight, user.id, user, i18n);
    return aiInsight;
  }

  private async _getAIPromptBasedOnUserData(
    useCase: UseCase,
    dto: ExecuteUseCaseDto,
    userDataTypes: UserDataType[],
    user: User,
    i18n?: I18nContext,
  ) {
    // using i18nService will only act like fallback language in this case english
    const locale = i18n ?? this.i18nService;
    const exportDataDtos: ExportDataDto[] = [];
    // await this.childrenService.findOneOrFail(dto.childId, null, {});

    if (userDataTypes.includes(UserDataType.ENTRIES)) {
      const filterEntryDto = this._getFilterEntryDto(dto);
      const data = await this.entriesService.getData(user, filterEntryDto);
      data.title = locale.t('User Data: Entries');
      exportDataDtos.push(data);
      console.log('data', data);
    }

    return this.useCasesService.getUserDataPrompt(useCase.question, dto, exportDataDtos);
  }

  _getFilterEntryDto(dto: ExecuteUseCaseDto): FilterEntryDto {
    const filterEntryDto: FilterEntryDto =
      dto.metaData?.usedUserData?.filterEntryDto ??
      ({
        startDate: dto.startDate,
        endDate: dto.endDate,
        take: 1000,
      } as FilterEntryDto);
    return filterEntryDto;
  }

  private _getUseCaseMetaData(useCase: UseCase, dto: ExecuteUseCaseDto): UseCaseMetaData {
    const usedUserMetaData: UsedUserMetaData = useCase.metaData?.usedUserData ?? dto.metaData?.usedUserData;

    if (!usedUserMetaData) return null;
    let mergedUsedUserData: UsedUserMetaData = {
      ...dto.metaData?.usedUserData,
      ...useCase.metaData?.usedUserData,
    };

    return {
      usedUserData: mergedUsedUserData,
      jsonSchema: useCase.jsonSchema,
    } as UseCaseMetaData;
  }

  private async _getAIPrompt(
    useCase: UseCase,
    dto: ExecuteUseCaseDto,
    metaData: UseCaseMetaData,
    i18n?: I18nContext,
    user?: User,
  ): Promise<string> {
    // check simple prompt with AI
    if (!metaData?.usedUserData) return useCase.question;

    const { lastTimeline, userDataTypes } = metaData.usedUserData;

    if (isEmpty(userDataTypes)) {
      throw new ConflictException(new AppError(ERR_INGISHT_REQUIRE_USER_DATA_TYPE_TO_EXECUTE));
    }

    if (!lastTimeline && !dto.startDate && !dto.endDate) {
      throw new ConflictException(new AppError(ERR_INGISHT_REQUIRE_TIMELINE_TO_EXECUTE));
    }

    if (lastTimeline) {
      const startEndDates = Utils.getStartEndDateByTimeline(lastTimeline);
      dto.startDate = startEndDates.startDate;
      dto.endDate = startEndDates.endDate;
    }

    return this._getAIPromptBasedOnUserData(useCase, dto, userDataTypes, user, i18n);
  }

  @Post(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_ADD_USE_CASE))
  createTranslation(@Param('id') id: string, @Body() dto: CreateUseCaseTranslationDto, @GetUser() me: User) {
    return this.useCasesService.createTranslation(id, dto, me);
  }

  @Patch('translations/:useCaseTranslationId')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_EDIT_USE_CASE))
  updateTranslation(
    @Param('useCaseTranslationId') useCaseTranslationId: string,
    @Body() dto: UpdateUseCaseTranslationDto,
    @GetUser() me: User,
  ) {
    return this.useCasesService.updateTranslation(useCaseTranslationId, dto, me);
  }

  @Get('translations/:useCaseTranslationId')
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_USE_CASE))
  findOneTranslation(@Param('useCaseTranslationId') useCaseTranslationId: string, @GetUser() me: User) {
    return this.useCasesService.findOneTranslation(useCaseTranslationId, me);
  }
}
