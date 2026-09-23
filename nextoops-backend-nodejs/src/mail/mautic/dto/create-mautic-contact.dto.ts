export class CreateMauticContactDto {
  data?: Record<string, any>;

  constructor(object?: Partial<CreateMauticContactDto>) {
    Object.assign(this, object);
  }
}
