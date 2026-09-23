import { EmotionState } from '../../entries/enums/emotion-state.enum';

export class CreateMoodDto {
  userId: string;
  day: string;
  entryCount: number;
  dominantEmotion?: EmotionState | null;
}
