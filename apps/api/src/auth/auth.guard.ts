import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "./public.decorator";
import * as jwksClient from "jwks-rsa";

let client: jwksClient.JwksClient | null = null;
function getClient() {
  if (!client) {
    client = jwksClient.default({
      jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
    });
  }
  return client;
}

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  getClient().getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
}

// Verifica o JWT emitido pelo Supabase Auth (ES256, via JWKS público) e popula
// req.user (App User local) + req.spaceId (primeira membership — 2 usuários / 1 Space no MVP,
// evolui pra header X-Space-Id na Fase 3 de múltiplos Spaces).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing Bearer token");
    }

    const token = authHeader.slice("Bearer ".length);
    
    let payload: SupabaseJwtPayload;
    try {
      payload = await new Promise((resolve, reject) => {
        jwt.verify(token, getKey, { algorithms: ["ES256"] }, (err, decoded) => {
          if (err || !decoded) reject(err);
          else resolve(decoded as SupabaseJwtPayload);
        });
      });
    } catch (err) {
      console.error("JWT verify failed:", err);
      throw new UnauthorizedException("Token inválido ou expirado");
    }

    if (!payload.email) {
      throw new UnauthorizedException("Token sem email");
    }

    // Upsert: primeiro login via magic link cria o App User local automaticamente.
    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: {},
      create: { email: payload.email, name: payload.email.split("@")[0] },
    });

    const membership = await this.prisma.spaceMember.findFirst({
      where: { userId: user.id },
    });
    if (!membership) {
      throw new UnauthorizedException("Usuário sem Space associado");
    }

    req.user = user;
    req.spaceId = membership.spaceId;
    return true;
  }
}
