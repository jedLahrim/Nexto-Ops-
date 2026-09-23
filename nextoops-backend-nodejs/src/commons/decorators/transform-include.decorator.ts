import { Transform } from 'class-transformer';

export function TransformStringToArray(target: any, key: string): void {
  Transform(({ value }) => {
    if (value.length == 0) return [];
    if (value.includes(',')) {
      const items = value.split(',');
      return items.map((item: string) => item.trim());
    } else {
      return [value];
    }
    // return value.includes(',') ? value.replace(/\s/g, '').split(',') : [value];
  })(target, key);
}
