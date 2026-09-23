import { Transform } from 'class-transformer';
import { PostContentType } from '../../posts/enum/post-type.enum';

export function TransformPostContentTypes(target: any, key: string): void {
  Transform(({ value }) => {
    if (value.length == 0) return [];
    let strings = value.includes(',') ? value.replace(/\s/g, '').split(',') : [value];
    let list = strings.map((str) => PostContentType[str as keyof typeof PostContentType]);
    return list;
  })(target, key);
}
