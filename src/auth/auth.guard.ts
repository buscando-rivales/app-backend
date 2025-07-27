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

  canActivate(context: ExecutionContext): boolean {
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
      // Validar nuestro JWT propio
      const payload = this.clerkService.verifyAppToken(token as string);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
