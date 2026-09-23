import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Example of JWT Refresh Token Rotation.
 * Enhances security by using short-lived access tokens and long-lived refresh tokens.
 */

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async login(user: any) {
        const payload = { sub: user.id, email: user.email };

        // 1. Generate Access Token (Short: 15min)
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

        // 2. Generate Refresh Token (Long: 7days)
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // 3. SECURE: Store hashed refresh token in DB to verify later
        await this.storeRefreshTokenInDb(user.id, refreshToken);

        return { accessToken, refreshToken };
    }

    async refreshToken(oldRefreshToken: string) {
        // 1. Verify token
        const payload = this.jwtService.verify(oldRefreshToken);

        // 2. IMPORTANT: Check if token matches stored token in DB (and hasn't been revoked)
        const isValid = await this.validateDbRefreshToken(payload.sub, oldRefreshToken);
        if (!isValid) throw new Error('Refresh token revoked or invalid');

        // 3. Generate new pair (Rotation)
        return this.login({ id: payload.sub, email: payload.email });
    }

    private async storeRefreshTokenInDb(userId: string, token: string) { /* Logic */ }
    private async validateDbRefreshToken(userId: string, token: string) { return true; }
}
