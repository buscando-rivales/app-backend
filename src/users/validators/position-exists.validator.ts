import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { PrismaService } from '../../services/prisma.service';

@ValidatorConstraint({ name: 'PositionExists', async: true })
@Injectable()
export class PositionExistsValidator implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(positionId: string): Promise<boolean> {
    if (!positionId) return true; // Si no hay positionId, no validar

    try {
      // Verificar que el servicio esté disponible
      if (!this.prisma) {
        console.error(
          'PrismaService is not available in PositionExistsValidator',
        );
        return true; // Permitir la validación para evitar bloqueos
      }

      const position = await this.prisma.positions.findUnique({
        where: { id: positionId },
      });

      return !!position; // Retorna true si la posición existe
    } catch (error) {
      console.error('Error in PositionExistsValidator:', error);
      return true; // En caso de error, permitir la validación para evitar bloqueos
    }
  }

  defaultMessage(): string {
    return 'La posición especificada no existe.';
  }
}

// Decorator personalizado para usar con @IsPositionExists()
export function IsPositionExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PositionExistsValidator,
    });
  };
}
