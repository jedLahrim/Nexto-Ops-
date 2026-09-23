import { User } from '../../user/entities/user.entity';
import { Entry } from '../../entries/entities/entry.entity';

export class EntryCreatedEvent {
  entry: Entry;
  createdBy: User;
  isFirstOne: boolean;
}
