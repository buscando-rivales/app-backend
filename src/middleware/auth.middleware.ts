import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClerkService } from '../auth/clerk.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly clerkService: ClerkService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'No se proporcionó token de autenticación',
      );
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      throw new UnauthorizedException('Tipo de autenticación inválido');
    }

    try {
      const user = await this.clerkService.verifyAndUpsertUser(token);
      // Agregamos el usuario al request para poder accederlo en los controladores
      req['user'] = user;
      next();
    } catch (error) {
      console.error('Error en la verificación del token:', error);
      throw new UnauthorizedException('Token inválido');
    }
  }
}
