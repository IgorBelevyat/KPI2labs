import jwt, { type SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

export class JwtTokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessExpiresIn: number = 15 * 60,
    private readonly refreshExpiresIn: number = 7 * 24 * 3600
  ) { }

  generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.accessExpiresIn };
    return jwt.sign(payload, this.accessSecret, options);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: this.refreshExpiresIn };
    return jwt.sign(payload, this.refreshSecret, options);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshSecret) as TokenPayload;
  }
}
