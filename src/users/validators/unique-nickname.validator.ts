import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { UsersService } from '../users.service';

@ValidatorConstraint({ name: 'UniqueNickname', async: true })
@Injectable()
export class UniqueNicknameValidator implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(
    nickname: string,
    args: ValidationArguments,
  ): Promise<boolean> {
    if (!nickname) return true; // Si no hay nickname, no validar

    try {
      // Verificar que el servicio esté disponible
      if (!this.usersService) {
        console.error(
          'UsersService is not available in UniqueNicknameValidator',
        );
        return true; // Permitir la validación para evitar bloqueos
      }

      const user = await this.usersService.findByNickname(nickname);

      // Si no se encuentra usuario con ese nickname, es válido
      if (!user) {
        return true;
      }

      // Si se encuentra un usuario, verificar si es el mismo usuario que está actualizando
      // (para permitir que un usuario mantenga su propio nickname)
      const currentUserId = (args.object as any).currentUserId;
      if (currentUserId && user.id === currentUserId) {
        return true;
      }

      return false; // Nickname ya existe y pertenece a otro usuario
    } catch (error) {
      console.error('Error in UniqueNicknameValidator:', error);
      return true; // En caso de error, permitir la validación para evitar bloqueos
    }
  }

  defaultMessage(): string {
    return 'El nickname $value ya está en uso. Por favor, elige otro.';
  }
}

// Decorator personalizado para usar con @IsUniqueNickname()
export function IsUniqueNickname(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: UniqueNicknameValidator,
    });
  };
}
