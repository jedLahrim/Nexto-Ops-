import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Pagination } from '../../commons/pagination/pagination';
import { PaginationDto } from '../../commons/pagination/pagination.dto';
import { AppError } from '../../commons/errors/app-error';
import { ERR_NOT_FOUND_ROOM } from '../../commons/errors/erp-error-codes';
import { AuditService } from '../../audit/audit.service';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepo: Repository<Room>,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateRoomDto, user: User): Promise<Room> {
    const room = this.roomRepo.create(dto);
    const saved = await this.roomRepo.save(room);
    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'room.create',
      entity: 'room',
      entityId: saved.id,
      details: `Created room: ${saved.name}`,
    });
    return saved;
  }

  async findAll(dto: PaginationDto, departmentId?: string, roomType?: string): Promise<Pagination<Room>> {
    const query = this.roomRepo
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.department', 'department');

    if (departmentId) {
      query.andWhere('room.departmentId = :departmentId', { departmentId });
    }
    if (roomType) {
      query.andWhere('room.roomType = :roomType', { roomType });
    }

    query.orderBy('room.name', 'ASC');
    query.take(dto.take);
    query.skip(dto.skip);
    const [data, total] = await query.getManyAndCount();
    return new Pagination<Room>(data, total);
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: { department: true },
    });
    if (!room) throw new NotFoundException(new AppError(ERR_NOT_FOUND_ROOM));
    return room;
  }

  async update(id: string, dto: UpdateRoomDto, user: User): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    const saved = await this.roomRepo.save(room);
    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'room.update',
      entity: 'room',
      entityId: saved.id,
    });
    return saved;
  }

  async remove(id: string, user: User): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepo.softRemove(room);
    await this.auditService.log({
      userId: user.id,
      userLabel: user.email ?? user.fullName,
      action: 'room.delete',
      entity: 'room',
      entityId: room.id,
    });
  }
}
