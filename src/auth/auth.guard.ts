import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ClerkService } from './clerk.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

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
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
