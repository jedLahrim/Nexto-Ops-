import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../jwt-playload.interface';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { AppError } from '../../commons/errors/app-error';
import { ERR_EXPIRED_TOKEN_OR_INVALID } from '../../commons/errors/errors-codes';

@Injectable()
export class jwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET_KEY'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .where('user.id=:id', { id: payload.id })
      .addSelect(['user.permissions'])
      .getOne();
    if (!user) throw new UnauthorizedException(new AppError(ERR_EXPIRED_TOKEN_OR_INVALID));

    return user;
  }
}
