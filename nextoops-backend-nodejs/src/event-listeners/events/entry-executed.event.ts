import { User } from '../../user/entities/user.entity';
import { Entry } from '../../entries/entities/entry.entity';

export class EntryExecutedEvent {
  entry: Entry;
  createdBy: User;
}
