import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';

export interface TransformBooleanOptions {
  defaultValue?: boolean;
}

export function TransformBoolean(options?: TransformBooleanOptions): (target: any, key: string) => void {
  return Transform(({ obj, key }) => {
    const value = obj[`${key}`];
    if (typeof value === 'boolean') {
      return value;
    } else if (typeof value === 'string') {
      // Validate string values
      if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      }
    }

    if (value === null || value === undefined) {
      return options?.defaultValue ?? value;
    } else {
      throw new BadRequestException({
        statusCode: 400,
        message: [`${key} must be a boolean value`],
        error: 'Bad Request',
      });
    }
  });
}
