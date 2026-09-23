import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTutorialDto } from './dto/create-tutorial.dto';
import { UpdateTutorialDto } from './dto/update-tutorial.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Tutorial } from './entities/tutorial.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AttachmentsService } from '../attachments/attachments.service';
import { AppError } from '../commons/errors/app-error';
import { ERR_ATTACHMENT_ALREADY_EXIST, ERR_NOT_FOUND_TUTORIAL } from '../commons/errors/errors-codes';
import { FilterTutorialDto, TutorialOrderBy } from './dto/filter-tutorial.dto';
import { UserType } from '../user/enums/user-type.enum';
import { Pagination } from '../commons/pagination/pagination';
import { User } from '../user/entities/user.entity';
import { UserTutorial } from './entities/user-tutorial.entity';
import { SortType } from '../commons/enums/sortType';

@Injectable()
export class TutorialsService {
  constructor(
    @InjectRepository(Tutorial)
    private tutorialRepo: Repository<Tutorial>,
    @InjectRepository(UserTutorial)
    private userTutorialRepo: Repository<UserTutorial>,
    private attachmentsService: AttachmentsService,
  ) {}

  async create(createTutorialDto: CreateTutorialDto, user: User): Promise<Tutorial> {
    let { name, userType, videoAttachment } = createTutorialDto;

    videoAttachment = await this.attachmentsService.checkAttachmentExistOrFail(videoAttachment.id);

    try {
      const tutorial = this.tutorialRepo.create({
        userType: userType,
        videoUrl: videoAttachment?.url,
        name: name,
        videoAttachment: videoAttachment,
      });
      return await this.tutorialRepo.save(tutorial);
    } catch (e) {
      throw new ConflictException(new AppError(ERR_ATTACHMENT_ALREADY_EXIST));
    }
  }

  async findAll(filterTutorialDto: FilterTutorialDto, user: User) {
    let { userType, mine, take, skip, orderBy, sortType } = filterTutorialDto;
    let query = this.tutorialRepo.createQueryBuilder('tutorial');
    this._filterTutorialByRelation(query, userType);
    if (mine) {
      query.leftJoinAndSelect('tutorial.userTutorials', 'userTutorial');
    }

    if (orderBy) {
      this._tutorialsOrderBy(query, orderBy, sortType);
    }

    query.leftJoinAndSelect('tutorial.videoAttachment', 'videoAttachment');

    query.take(take);
    query.skip(skip);
    const [data, total] = await query.getManyAndCount();

    if (mine) {
      data.forEach((value) => value.setUserViewed(user.id));
    }

    return new Pagination<Tutorial>(data, total);
  }

  async findOne(id: string, user: User): Promise<Tutorial> {
    let tutorial = await this.tutorialRepo.findOne({
      where: { id: id },
      relations: { videoAttachment: true },
      withDeleted: true,
    });
    if (!tutorial) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TUTORIAL));
    }
    return tutorial;
  }

  async update(id: string, updateTutorialDto: UpdateTutorialDto, user: User): Promise<Tutorial> {
    let { videoAttachment, userType, name } = updateTutorialDto;
    if (updateTutorialDto.videoAttachment) {
      videoAttachment = await this.attachmentsService.checkAttachmentExistOrFail(updateTutorialDto.videoAttachment.id);
    }
    let updateResult = await this.tutorialRepo.update(id, {
      userType: userType,
      videoUrl: videoAttachment?.url,
      name: name,
      videoAttachment: videoAttachment,
    });
    if (updateResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TUTORIAL));
    }
    return this.findOne(id, user);
  }

  async remove(id: string, archive: boolean) {
    let deleteResult = archive ? await this.tutorialRepo.softDelete(id) : await this.tutorialRepo.delete(id);
    if (deleteResult.affected == 0) {
      throw new NotFoundException(new AppError(ERR_NOT_FOUND_TUTORIAL));
    }
  }

  async viewed(id: string, user: User): Promise<void> {
    let userTutorial = await this.userTutorialRepo.findOne({
      where: { tutorial: { id: id }, user: { id: user.id } },
    });
    if (!userTutorial) {
      userTutorial = this.userTutorialRepo.create({
        viewed: true,
        tutorial: { id: id },
        user: { id: user.id },
      });
    } else {
      userTutorial.viewed = true;
    }

    await this.userTutorialRepo.save(userTutorial);
  }

  private _filterTutorialByRelation(query: SelectQueryBuilder<Tutorial>, relation: UserType) {
    if (relation) query.where('tutorial.userType= :relation  ', { relation });
  }

  private _tutorialsOrderBy(query: SelectQueryBuilder<Tutorial>, orderBy: TutorialOrderBy, sortType: SortType) {
    switch (orderBy) {
      case TutorialOrderBy.UPDATED_AT:
        query.orderBy('tutorial.updatedAt', sortType);
        break;
      case TutorialOrderBy.CREATED_AT:
        query.orderBy('tutorial.createdAt', sortType);
        break;
    }
  }
}
