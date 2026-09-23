import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suggestion } from './entities/suggestion.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class SuggestionsService {
  constructor(
    @InjectRepository(Suggestion)
    private suggestionRepository: Repository<Suggestion>,
  ) {}

  async create(dto: CreateSuggestionDto, user: User): Promise<Suggestion> {
    const { message }: CreateSuggestionDto = dto;
    const suggestion = this.suggestionRepository.create({
      message,
      user,
    });
    return this.suggestionRepository.save(suggestion);
  }

  async findAll(): Promise<Suggestion[]> {
    return this.suggestionRepository.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<Suggestion> {
    const suggestion = await this.suggestionRepository.findOne({ where: { id }, relations: { user: true } });
    if (!suggestion) {
      throw new NotFoundException(`Suggestion with ID ${id} not found`);
    }
    return suggestion;
  }
}
