import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export enum NotificationType {
  GAME_JOIN = 'game_join',
  GAME_LEAVE = 'game_leave',
  GAME_KICK = 'game_kick',
  GAME_CANCEL = 'game_cancel',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPT = 'friend_accept',
  GAME_UPDATE = 'game_update',
  GENERAL = 'general',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID del usuario que recibirá la notificación',
    example: 'user_123456789',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nuevo jugador se unió a tu juego',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje de la notificación',
    example: 'Juan Pérez se unió a tu juego de fútbol 5 el viernes a las 18:00',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: NotificationType.GAME_JOIN,
  })
  @IsString()
  type: NotificationType;

  @ApiProperty({
    description: 'Datos adicionales específicos del tipo de notificación',
    example: { gameId: 'game_123', playerId: 'user_456' },
    required: false,
  })
  @IsOptional()
  data?: Record<string, any>;
}

export class NotificationDto {
  @ApiProperty({
    description: 'ID único de la notificación',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID del usuario que recibe la notificación',
    example: 'user_123456789',
  })
  userId: string;

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nuevo jugador se unió a tu juego',
  })
  title: string;

  @ApiProperty({
    description: 'Cuerpo del mensaje de la notificación',
    example: 'Juan Pérez se unió a tu juego de fútbol 5 el viernes a las 18:00',
  })
  body: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: NotificationType.GAME_JOIN,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Si la notificación ha sido leída',
    example: false,
  })
  read: boolean;

  @ApiProperty({
    description: 'Fecha de creación de la notificación',
    example: '2025-07-30T15:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Datos adicionales específicos del tipo de notificación',
    example: { gameId: 'game_123', playerId: 'user_456' },
    required: false,
  })
  @IsOptional()
  data?: Record<string, any>;
}

export class NotificationListResponseDto {
  @ApiProperty({
    description: 'Lista de notificaciones',
    type: [NotificationDto],
  })
  notifications: NotificationDto[];

  @ApiProperty({
    description: 'Total de notificaciones',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Número de notificaciones no leídas',
    example: 3,
  })
  unreadCount: number;
}

export class MarkAsReadDto {
  @ApiProperty({
    description: 'ID de la notificación a marcar como leída',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  notificationId: string;
}

export class MarkAllAsReadDto {
  @ApiProperty({
    description: 'Marcar todas las notificaciones como leídas',
    example: true,
  })
  @IsBoolean()
  markAll: boolean;
}
