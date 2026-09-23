import * as request from 'supertest';

/**
 * Example of an End-to-End (E2E) Test.
 * Tests the entire application flow from the outside, usually against a real staging environment.
 */

const BASE_URL = 'http://localhost:3000';

describe('Auth Flow (E2E)', () => {
    let accessToken: string;

    it('should login and return a JWT', async () => {
        const response = await request(BASE_URL)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password123' })
            .expect(201);

        expect(response.body).toHaveProperty('accessToken');
        accessToken = response.body.accessToken;
    });

    it('should access protected profile with JWT', async () => {
        await request(BASE_URL)
            .get('/user/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.email).toBe('test@example.com');
            });
    });
});
