import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSuggestionDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
