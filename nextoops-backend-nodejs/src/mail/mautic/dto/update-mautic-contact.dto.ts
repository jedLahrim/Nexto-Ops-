import { CreateMauticContactDto } from './create-mautic-contact.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateMauticContactDto extends PartialType(CreateMauticContactDto) {
  constructor(object?: Partial<UpdateMauticContactDto>) {
    super(object);
    Object.assign(this, object);
  }
}
