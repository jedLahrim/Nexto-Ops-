import { User } from '../../user/entities/user.entity';
import { ExecuteUseCaseDto } from '../../ai/categories/use-cases/dto/execute-use-case.dto';

export class ExecuteUseCaseEvent {
  useCaseId: string;
  dto: ExecuteUseCaseDto;
  user: User;
}
