import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Version, VersioningType } from '@nestjs/common';

/**
 * Example of API Versioning strategies in NestJS.
 */

@Controller({ path: 'users', version: '1' })
export class UsersV1Controller {
    @Get()
    findAll() {
        return 'This action returns all users (V1)';
    }
}

@Controller({ path: 'users', version: '2' })
export class UsersV2Controller {
    @Get()
    findAll() {
        return { data: [], message: 'V2 returns structured data' };
    }
}

@Module({
    controllers: [UsersV1Controller, UsersV2Controller],
})
export class VersioningModule { }

async function bootstrap() {
    const app = await NestFactory.create(VersioningModule);

    // Enable URI versioning (e.g., /v1/users)
    app.enableVersioning({
        type: VersioningType.URI,
    });

    /* 
    Alternatively, use Header Versioning:
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: 'Api-Version',
    });
    */

    await app.listen(3000);
}
