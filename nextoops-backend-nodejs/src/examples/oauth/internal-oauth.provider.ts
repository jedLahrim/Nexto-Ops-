import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * Example of an Internal OAuth2 Provider (Authorization Server).
 * This demonstrates how to issue your own tokens without a third-party like Google.
 * 
 * Flow:
 * 1. Client sends 'client_id' and 'client_secret'.
 * 2. Provider validates the client.
 * 3. Provider issues an Access Token (JWT).
 */

interface OAuthClient {
    clientId: string;
    clientSecretHash: string;
    scopes: string[];
}

@Injectable()
export class InternalOAuthProvider {
    // In a real app, this would be a Database table 'oauth_clients'
    private readonly clients: OAuthClient[] = [
        {
            clientId: 'mobile_app_123',
            // Hash for 'super_secret_secret'
            clientSecretHash: '$2b$10$EixZAYVK1VzKNzM9fQRuyOuE.9R.8/Rz9Wz.9R.8/Rz9Wz.9R.8/Rz',
            scopes: ['read', 'write'],
        },
    ];

    constructor(private jwtService: JwtService) { }

    /**
     * Validates client credentials and issues a JWT.
     * This is equivalent to the '/oauth/token' endpoint.
     */
    async issueToken(clientId: string, clientSecret: string) {
        const client = this.clients.find((c) => c.clientId === clientId);

        if (!client) {
            throw new UnauthorizedException('Invalid Client ID');
        }

        // Verify the secret
        const isMatch = await bcrypt.compare(clientSecret, client.clientSecretHash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid Client Secret');
        }

        // Generate Payload
        const payload = {
            iss: 'yozen-internal-auth',
            sub: client.clientId,
            scopes: client.scopes,
        };

        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '1h' }),
            token_type: 'Bearer',
            expires_in: 3600,
        };
    }

    /**
     * Middleware/Guard helper to verify internal tokens.
     */
    async verifyToken(token: string) {
        try {
            return this.jwtService.verify(token);
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired internal token');
        }
    }
}
