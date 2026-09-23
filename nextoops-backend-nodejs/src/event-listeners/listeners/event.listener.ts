import { Injectable } from '@nestjs/common';
import { EventListenersService } from '../event-listeners.service';

@Injectable()
export class EventListener {
  constructor(private readonly eventListenersService: EventListenersService) {}

  //
  // @OnEvent('tracking.created', { async: true })
  // async handleTrackingCreatedEvent(event: EntryCreatedEvent) {
  //   return this.eventListenersService.handleTrackingCreatedEvent(event);
  // }
  //
  // @OnEvent('note.created', { async: true })
  // async handleNoteCreatedEvent(event: NoteCreatedEvent) {
  //   console.log('handleNoteCreatedEvent');
  //   return this.eventListenersService.handleNoteCreatedEvent(event);
  // }
  //
  // @OnEvent('tracking.removed', { async: true })
  // async handleTrackingRemovedEvent(event: EntryRemovedEvent) {
  //   return this.eventListenersService.handleTrackingRemovedEvent(event);
  // }
  //
  // @OnEvent('note.removed', { async: true })
  // async handleNoteRemovedEvent(event: NoteRemovedEvent) {
  //   console.log('handleNoteCreatedEvent');
  //   return this.eventListenersService.handleNoteRemovedEvent(event);
  // }
  //
  // @OnEvent('child.cared', { async: true })
  // async handleChildCaredEvent(event: ChildCaredEvent) {
  //   console.log('handleNoteCreatedEvent');
  //   return this.eventListenersService.handleChildCaredEvent(event);
  // }
  //
  // @OnEvent('attachment.uploaded', { async: true })
  // async handleAttachmentUploaded(event: AttachmentUploadedEvent) {
  //   return this.eventListenersService.handleAttachmentUploaded(event);
  // }
}
