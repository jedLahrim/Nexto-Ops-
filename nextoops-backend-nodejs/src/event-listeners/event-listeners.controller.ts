import { Controller } from '@nestjs/common';
import { EventListenersService } from './event-listeners.service';

@Controller('event-listeners')
export class EventListenersController {
  constructor(private readonly eventListenersService: EventListenersService) {}
}
