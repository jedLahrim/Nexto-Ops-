import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { toMs } from 'ms-typescript';
import { AppError } from '../commons/errors/app-error';
import {
  ERR_EXPIRED_TOKEN_OR_INVALID,
  ERR_INVALID_TOKEN,
  ERR_TOKEN_ALREADY_USED,
  ERR_TOKEN_NOT_FOUND,
} from '../commons/errors/errors-codes';
import { Token } from './entities/token.entity';
import { Constant } from '../commons/constant';
import { JwtPayload, MagicLinkPayload } from '../user/jwt-playload.interface';

@Injectable()
export class TokensService {
  jwtSecret: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Token)
    private tokenRepo: Repository<Token>,
  ) {
    this.jwtSecret = this.configService.get('JWT_SECRET_KEY');
  }

  // return id of payload
  async validateToken(token: string, consumeToken: boolean = false): Promise<string> {
    if (consumeToken) {
      const foundedToken = await this.findOneByValue(token);
      await this._consumeToken(foundedToken);
    }

    return this._handleTokenVerification(token).id;
  }

  async validatePayloadToken(token: string, consumeToken: boolean = false): Promise<MagicLinkPayload> {
    if (consumeToken) {
      const foundedToken = await this.findOneByValue(token);
      await this._consumeToken(foundedToken);
    }

    return this._handleTokenVerification(token);
  }

  decodeToken(token: string): JwtPayload {
    const payload = jwt.decode(token);
    return payload as JwtPayload;
  }

  async findOneByValue(value: string): Promise<Token> {
    const foundedToken = await this.tokenRepo.findOne({
      where: { value },
    });
    if (!foundedToken) throw new NotFoundException(new AppError(ERR_TOKEN_NOT_FOUND));

    return foundedToken;
  }

  async consumeTokenByValue(token: string): Promise<Token> {
    const foundedToken = await this.findOneByValue(token);
    return this._consumeToken(foundedToken);
  }

  async generateToken(
    payload: any,
    expiresIn: string,
    maxConsuming?: number,
    persistData: boolean = false,
  ): Promise<Token> {
    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: expiresIn as any,
    });
    const expiredAt = new Date(new Date().getTime() + toMs(expiresIn));
    const newToken = this.tokenRepo.create({
      value: token,
      expiredAt: expiredAt,
      maxConsuming,
    });

    return persistData ? this.tokenRepo.save(newToken) : newToken;
  }

  async generateTokens(payloads: JwtPayload[], expiresIn: string, maxConsuming?: number): Promise<Token[]> {
    const expiredAt = new Date(new Date().getTime() + toMs(Constant.MAGIC_LINK_USER_LOGIN_EXPIRES_IN));
    const tokens: Token[] = [];
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: expiresIn as any,
      });
      const newToken = this.tokenRepo.create({
        value: token,
        expiredAt: expiredAt,
        maxConsuming,
      });
      tokens.push(newToken);
    }

    return this.tokenRepo.save(tokens);
  }

  private _consumeToken(token: Token): Promise<Token> {
    if (token.consumed === true) {
      throw new NotFoundException(new AppError(ERR_TOKEN_ALREADY_USED));
    }
    token.consumedTimes++;
    return this.tokenRepo.save(token);
  }

  private _handleTokenVerification(token: string) {
    try {
      const payload: any = jwt.verify(token, this.jwtSecret);
      return payload;
    } catch (e) {
      if (e.message == 'jwt expired') {
        throw new NotFoundException(new AppError(ERR_EXPIRED_TOKEN_OR_INVALID));
      }
      throw new NotFoundException(new AppError(ERR_INVALID_TOKEN, { message: e.message }));
    }
  }
}
