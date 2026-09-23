import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { GetUser } from 'src/user/get-user.decorator';
import { Suggestion } from './entities/suggestion.entity';
import { User } from 'src/user/entities/user.entity';
import { JwtAuthGuard } from 'src/user/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/user/guards/permission.guard';
import { UserPermissionsType } from 'src/user/enums/user-permission.enum';

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionService: SuggestionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSuggestionDto: CreateSuggestionDto, @GetUser() user: User): Promise<Suggestion> {
    return this.suggestionService.create(createSuggestionDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard(UserPermissionsType.CAN_VIEW_SUGGESTIONS))
  findAll() {
    return this.suggestionService.findAll();
  }
}
