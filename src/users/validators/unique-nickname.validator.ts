import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UsersService } from '../users.service';

@ValidatorConstraint({ name: 'UniqueNickname', async: true })
@Injectable()
export class UniqueNicknameValidator implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(nickname: string): Promise<boolean> {
    if (!nickname) return true; // Si no hay nickname, no validar

    const user = await this.usersService.findByNickname(nickname);
    return !user; // Retorna true si no existe un usuario con el mismo nickname
  }

  defaultMessage(): string {
    return 'El nickname $value ya está en uso. Por favor, elige otro.';
  }
}
