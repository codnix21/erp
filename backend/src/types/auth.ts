import { FastifyRequest } from 'fastify';

export interface JWTPayload {
  userId: string;
  email: string;
  companyId?: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    companyId?: string;
    roles?: string[];
  };
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

