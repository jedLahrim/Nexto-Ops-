import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { User } from '../user/entities/user.entity';
import { canTransition, TRANSITIONS, TicketStatus } from '../commons/utils/ticket.utils';
import { MauticService } from '../mail/mautic/mautic.service';

@Injectable()
export class ItsmService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(TicketMessage)
    private readonly messageRepo: Repository<TicketMessage>,
    private readonly mauticService: MauticService,
  ) {}

  /**
   * Generates a ticket number (e.g. INC-001, PRB-001)
   */
  private async generateTicketNumber(type: string): Promise<string> {
    const prefix = type === 'problem' ? 'PRB' : type === 'change' ? 'CHG' : 'INC';
    const lastTicket = await this.incidentRepo.findOne({
      where: { type },
      order: { createdAt: 'DESC' },
    });
    
    let nextNum = 1;
    if (lastTicket && lastTicket.ticketNumber.startsWith(prefix)) {
      const match = lastTicket.ticketNumber.match(/\d+$/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    
    return `${prefix}-${nextNum.toString().padStart(4, '0')}`;
  }

  async findAll(type: string) {
    return this.incidentRepo.find({
      where: { type },
      relations: ['reporter', 'assignee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const incident = await this.incidentRepo.findOne({
      where: { id },
      relations: ['reporter', 'assignee'],
    });
    if (!incident) throw new NotFoundException('Ticket not found');
    return incident;
  }

  async create(type: string, dto: { title: string; description: string; priority?: string }, reporter: User) {
    const ticketNumber = await this.generateTicketNumber(type);
    
    const incident = this.incidentRepo.create({
      type,
      ticketNumber,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'Low',
      status: 'new',
      reporter,
    });
    
    return this.incidentRepo.save(incident);
  }

  async update(id: string, dto: any) {
    const incident = await this.findOne(id);
    Object.assign(incident, dto);
    return this.incidentRepo.save(incident);
  }

  async remove(id: string) {
    const incident = await this.findOne(id);
    return this.incidentRepo.remove(incident);
  }

  async updateStatus(id: string, newStatus: TicketStatus) {
    const incident = await this.findOne(id);
    
    if (!canTransition(incident.status as TicketStatus, newStatus)) {
      throw new BadRequestException(`Cannot transition from ${incident.status} to ${newStatus}`);
    }
    
    incident.status = newStatus;
    
    if (newStatus === 'resolved' || newStatus === 'closed') {
      incident.resolvedAt = new Date();
    }
    
    const saved = await this.incidentRepo.save(incident);

    // Trigger Mautic notification logic mock (implemented in MauticService next)
    try {
      await this.mauticService.sendTicketNotification(
        incident.reporter?.id,
        saved.id,
        { action: 'status_changed', status: newStatus, ticketNumber: saved.ticketNumber }
      );
    } catch (e) {
      console.error('Failed to send Mautic notification:', e);
    }

    return saved;
  }

  async assign(id: string, assignee: User) {
    const incident = await this.findOne(id);
    incident.assignee = assignee;
    incident.status = 'assigned';
    
    const saved = await this.incidentRepo.save(incident);
    
    // Notify assignee
    try {
      await this.mauticService.sendTicketNotification(
        assignee.id,
        saved.id,
        { action: 'assigned_to_you', ticketNumber: saved.ticketNumber }
      );
    } catch (e) {
      console.error('Failed to send Mautic notification:', e);
    }

    return saved;
  }

  // Messaging (WebSockets support)
  async getMessages(incidentId: string) {
    return this.messageRepo.find({
      where: { incident: { id: incidentId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async addMessage(incidentId: string, sender: User, content: string) {
    const incident = await this.findOne(incidentId);
    const message = this.messageRepo.create({
      incident,
      sender,
      content,
    });
    return this.messageRepo.save(message);
  }
}
