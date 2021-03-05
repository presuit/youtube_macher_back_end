export interface IJwtOptions {
  jwtSecret: string;
}

export interface IJwtTokenPayload {
  id: string | number;
}

export const JWT_OPTIONS = 'JWT_OPTIONS';
