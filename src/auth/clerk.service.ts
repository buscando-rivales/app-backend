import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { PrismaService } from '../services/prisma.service';
import * as jwt from 'jsonwebtoken';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  roles?: string[];
}

@Injectable()
export class ClerkService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async createUserSession(userId: string) {
    try {
      const session = await this.clerk.sessions.createSession({
        userId,
      });

      const sessionToken = await this.clerk.sessions.getToken(session.id);
      return sessionToken;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async verifyAndUpsertUser(token: string) {
    try {
      // Verificar el token y obtener la información del usuario
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!verifiedToken || !verifiedToken.sub) {
        throw new UnauthorizedException('Token inválido');
      }

      // Obtener información detallada del usuario desde Clerk
      const clerkUser = await this.clerk.users.getUser(verifiedToken.sub);
      if (!clerkUser) {
        throw new UnauthorizedException('Usuario no encontrado');
      }
      // Buscar o crear el usuario en nuestra base de datos
      const user = await this.prisma.user.upsert({
        where: { id: clerkUser.id },
        update: {
          email: clerkUser.emailAddresses[0]?.emailAddress,
          fullName: clerkUser.fullName || '',
        },
        create: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          fullName: clerkUser.fullName || '',
        },
      });

      return user;
    } catch (error) {
      console.error('Error durante la verificación del token:', error);
      throw new UnauthorizedException('Error de autenticación');
    }
  }

  generateAppToken(user: AppUser) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no definido en variables de entorno');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles || [],
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  }

  verifyAppToken(token: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no definido en variables de entorno');
    }
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      console.error('Error verificando el token de aplicación:', e);
      throw new UnauthorizedException('Token de aplicación inválido');
    }
  }
}
