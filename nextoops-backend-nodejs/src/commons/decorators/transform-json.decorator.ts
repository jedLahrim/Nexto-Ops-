import { isJSON, isObject } from 'class-validator';
import { Transform } from 'class-transformer';

export function TransformJson(target: any, key: string): void {
  Transform(({ value }) => {
    if (isJSON(value)) {
      return JSON.parse(`${value}`);
    } else if (isObject(value)) {
      return value;
    } else {
      return {};
    }
  })(target, key);
}
