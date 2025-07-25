import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { PrismaService } from '../services/prisma.service';

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
}
