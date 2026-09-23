export class JwtPayload {
  id: string;
  iat?: number;
  exp?: number;

  constructor(id: string, iat: number, exp: number) {
    this.id = id;
    this.iat = iat;
    this.exp = exp;
  }
}

export class MagicLinkPayload extends JwtPayload {
  generatedById?: string;

  constructor(id: string, iat: number, exp: number, generatedById: string) {
    super(id, iat, exp);
    this.generatedById = generatedById;
  }
}
