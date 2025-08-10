import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsInt,
  MaxLength,
  MinLength,
  IsIn,
  IsDateString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { IsUniqueNickname } from '../validators/unique-nickname.validator';
import { IsPositionExists } from '../validators/position-exists.validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  id: string; // Clerk User ID

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ default: 5.0 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  // Rating del 1 al 5, opcional entero
  @ApiProperty({ required: false, default: 5.0 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  //nikename opcional
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsUniqueNickname({
    message: 'El nickname ya está en uso. Por favor, elige otro.',
  })
  nickname?: string;

  // Posición del jugador
  @ApiProperty({
    required: false,
    description: 'ID de la posición del jugador',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID(4, { message: 'El ID de posición debe ser un UUID válido' })
  @IsPositionExists()
  @IsOptional()
  positionId?: string;

  // Género
  @ApiProperty({
    required: false,
    enum: ['masculino', 'femenino', 'otro'],
    description: 'Género del usuario',
    example: 'masculino',
  })
  @IsIn(['masculino', 'femenino', 'otro'], {
    message: 'El género debe ser masculino, femenino u otro',
  })
  @IsOptional()
  gender?: string;

  // Fecha de nacimiento
  @ApiProperty({
    required: false,
    description: 'Fecha de nacimiento (formato YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe ser una fecha válida' },
  )
  @IsOptional()
  birthDate?: string;

  // Biografía
  @ApiProperty({
    required: false,
    description: 'Biografía del usuario',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: 'La biografía no puede exceder 500 caracteres' })
  @IsOptional()
  bio?: string;

  // Nombre de usuario de Instagram
  @ApiProperty({
    required: false,
    description: 'Nombre de usuario de Instagram (sin @)',
    example: 'usuario123',
  })
  @IsString()
  @MaxLength(30, {
    message: 'El nombre de usuario de Instagram no puede exceder 30 caracteres',
  })
  @IsOptional()
  instagramUsername?: string;

  // Nombre de usuario de Facebook
  @ApiProperty({
    required: false,
    description: 'Nombre de usuario de Facebook',
    example: 'usuario.facebook',
  })
  @IsString()
  @MaxLength(50, {
    message: 'El nombre de usuario de Facebook no puede exceder 50 caracteres',
  })
  @IsOptional()
  facebookUsername?: string;

  // Perfil público
  @ApiProperty({
    required: false,
    description: 'Si el perfil es público o privado',
    default: true,
  })
  @IsBoolean({ message: 'isPublicProfile debe ser true o false' })
  @IsOptional()
  isPublicProfile?: boolean;

  /**
   * Transforma los campos del DTO al formato esperado por Prisma (snake_case)
   */
  toPrismaData(): Record<string, any> {
    const prismaData: Record<string, any> = {};

    // Campos que no necesitan mapeo
    if (this.fullName !== undefined) prismaData.fullName = this.fullName;
    if (this.phone !== undefined) prismaData.phone = this.phone;
    if (this.avatarUrl !== undefined) prismaData.avatarUrl = this.avatarUrl;
    if (this.rating !== undefined) prismaData.rating = this.rating;
    if (this.nickname !== undefined) prismaData.nickname = this.nickname;
    if (this.gender !== undefined) prismaData.gender = this.gender;
    if (this.bio !== undefined) prismaData.bio = this.bio;

    // Campos que necesitan mapeo de camelCase a snake_case
    if (this.positionId !== undefined) prismaData.position_id = this.positionId;
    if (this.birthDate !== undefined && this.birthDate !== '') {
      // Convertir string de fecha a objeto Date para Prisma
      const date = new Date(this.birthDate);
      // Verificar que la fecha sea válida
      if (!isNaN(date.getTime())) {
        prismaData.birth_date = date;
      }
      console.log('Debug birthDate:', {
        original: this.birthDate,
        converted: date,
        isValid: !isNaN(date.getTime()),
        final: prismaData.birth_date,
      });
    }
    if (this.instagramUsername !== undefined)
      prismaData.instagram_username = this.instagramUsername;
    if (this.facebookUsername !== undefined)
      prismaData.facebook_username = this.facebookUsername;
    if (this.isPublicProfile !== undefined)
      prismaData.is_public_profile = this.isPublicProfile;

    console.log('Final prismaData:', prismaData);
    return prismaData;
  }
}

/**
 * DTO for searching users by nickname
 */
export class SearchUsersDto {
  @ApiProperty({
    description: 'Search query for user nickname (minimum 2 characters)',
    example: 'john',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters long' })
  @MaxLength(50, { message: 'Search query must not exceed 50 characters' })
  @Transform(({ value }) => value.trim().toLowerCase())
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

/**
 * DTO representing a user in search results
 */
export class UserSearchResultDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user_2NNEqL2vHPEFSZGWHZxf3l1c5Oa',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'User nickname',
    example: 'johndoe',
  })
  nickname: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'User rating (1-5 stars)',
    example: 4.5,
    nullable: true,
  })
  rating?: number | null;
}

/**
 * DTO for user search response
 */
export class UserSearchResponseDto {
  @ApiProperty({
    description: 'Array of users matching the search query',
    type: [UserSearchResultDto],
  })
  users: UserSearchResultDto[];

  @ApiProperty({
    description: 'Total number of users found',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Search query used',
    example: 'john',
  })
  query: string;
}
