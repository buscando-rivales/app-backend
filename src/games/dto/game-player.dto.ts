import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';

export class JoinGameDto {
  @ApiProperty({
    description: 'ID del juego al que el usuario se quiere unir',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  gameId: string;
}

export class UpdatePlayerStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del jugador en el juego',
    enum: ['joined', 'left', 'kicked'],
    example: 'joined',
  })
  @IsIn(['joined', 'left', 'kicked'])
  status: string;
}

export class GamePlayerDto {
  @ApiProperty({
    description: 'ID único del registro de jugador en el juego',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID del juego',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  gameId: string;

  @ApiProperty({
    description: 'ID del jugador',
    example: 'user_123456789',
  })
  playerId: string;

  @ApiProperty({
    description: 'Fecha y hora cuando el jugador se unió al juego',
    example: '2025-07-30T15:30:00Z',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Estado del jugador en el juego',
    enum: ['joined', 'left', 'kicked'],
    example: 'joined',
  })
  status: string;

  @ApiProperty({
    description: 'Información del jugador',
    required: false,
  })
  @IsOptional()
  player?: {
    id: string;
    fullName: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    rating?: number | null;
  };
}

export class GamePlayersResponseDto {
  @ApiProperty({
    description: 'Lista de jugadores en el juego',
    type: [GamePlayerDto],
  })
  players: GamePlayerDto[];

  @ApiProperty({
    description: 'Total de jugadores en el juego',
    example: 8,
  })
  totalPlayers: number;

  @ApiProperty({
    description: 'Espacios disponibles restantes',
    example: 2,
  })
  availableSpots: number;

  @ApiProperty({
    description: 'Total de espacios en el juego',
    example: 10,
  })
  totalSpots: number;
}
