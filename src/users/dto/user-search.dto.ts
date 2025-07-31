import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @ApiProperty({
    description: 'Texto de búsqueda para buscar usuarios por nickname',
    example: 'player123',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Límite de resultados a retornar',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class UserSearchResultDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 'usr_123456789',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  fullName: string;

  @ApiProperty({
    description: 'Nickname del usuario',
    example: 'player123',
  })
  nickname: string;

  @ApiProperty({
    description: 'URL del avatar del usuario',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'Rating del usuario',
    example: 85.5,
    nullable: true,
  })
  rating: number | null;
}

export class UserSearchResponseDto {
  @ApiProperty({
    description: 'Lista de usuarios encontrados',
    type: [UserSearchResultDto],
  })
  users: UserSearchResultDto[];

  @ApiProperty({
    description: 'Total de usuarios encontrados',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Query de búsqueda utilizada',
    example: 'player123',
  })
  query: string;
}
