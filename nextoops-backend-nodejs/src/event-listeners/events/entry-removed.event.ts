import { EntryCreatedEvent } from './entry-created.event';
import { PartialType } from '@nestjs/mapped-types';
import { Entry } from '../../entries/entities/entry.entity';

export class EntryRemovedEvent extends PartialType(EntryCreatedEvent) {
}
