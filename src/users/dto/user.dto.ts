import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Validate,
} from 'class-validator';
import { UniqueNicknameValidator } from '../validators/unique-nickname.validator';

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
  @Validate(UniqueNicknameValidator)
  nickname?: string;
}
