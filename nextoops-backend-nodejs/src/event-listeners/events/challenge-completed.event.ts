import { User } from '../../user/entities/user.entity';
import { Challenge } from '../../challenges/entities/challenge.entity';
import { UserChallenge } from '../../challenges/entities/user-challenge.entity';

export class ChallengeCompletedEvent {
  challenge: Challenge;
  userChallenge: UserChallenge;
  user: User;
}
