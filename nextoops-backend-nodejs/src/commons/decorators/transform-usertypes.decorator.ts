import { Transform } from 'class-transformer';
import { UserType } from '../../user/enums/user-type.enum';

export function TransformUserTypes(target: any, key: string): void {
  Transform(({ value }) => {
    if (value.length == 0) return [];
    let strings = value.includes(',') ? value.replace(/\s/g, '').split(',') : [value];
    let userTypes = strings.map((str) => UserType[str as keyof typeof UserType]);
    return userTypes;
  })(target, key);
}
