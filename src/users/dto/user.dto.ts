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
} from 'class-validator';
import { IsUniqueNickname } from '../validators/unique-nickname.validator';
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
