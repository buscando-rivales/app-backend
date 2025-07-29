import {
  IsString,
  IsInt,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsIn,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({
  name: 'AvailableSpotsNotGreaterThanTotal',
  async: false,
})
class AvailableSpotsNotGreaterThanTotal
  implements ValidatorConstraintInterface
{
  validate(availableSpots: number, args: ValidationArguments) {
    const object = args.object as any;
    return typeof availableSpots === 'number' &&
      typeof object.totalSpots === 'number'
      ? availableSpots <= object.totalSpots
      : true;
  }
  defaultMessage(args: ValidationArguments) {
    console.log(args);
    return 'availableSpots cannot be greater than totalSpots';
  }
}

export class CreateGameDto {
  // organizerId eliminado, se obtiene del JWT

  @ApiProperty({
    description: 'ID of the field where the game will be played',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  fieldId: string;

  @ApiProperty({
    description: 'Type of game (5 for fútbol 5, 7 for fútbol 7)',
    minimum: 5,
    maximum: 7,
    example: 5,
  })
  @IsInt()
  @Min(5)
  @Max(7)
  gameType: number;

  @ApiProperty({
    description:
      'Game skill level (1-5, where 1 is beginner and 5 is professional)',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  gameLevel: number;

  @ApiProperty({
    description: 'Game start time in ISO format',
    example: '2024-12-25T18:00:00.000Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Game end time in ISO format',
    example: '2024-12-25T19:30:00.000Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Total number of spots available for the game',
    example: 10,
  })
  @IsInt()
  totalSpots: number;

  @ApiProperty({
    description: 'Number of available spots (must be <= totalSpots)',
    example: 8,
  })
  @IsInt()
  @Validate(AvailableSpotsNotGreaterThanTotal)
  availableSpots: number;

  @ApiProperty({
    description: 'Price per player in local currency',
    example: 2500.5,
  })
  @IsNumber()
  pricePerPlayer: number;

  @ApiProperty({
    description: 'Current status of the game',
    enum: ['open', 'full', 'cancelled', 'completed'],
    example: 'open',
  })
  @IsString()
  @IsIn(['open', 'full', 'cancelled', 'completed'])
  status: string;
}

export class UpdateGameDto {
  @ApiProperty({
    description: 'ID of the field where the game will be played',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsString()
  fieldId?: string;

  @ApiProperty({
    description: 'Type of game (5 for fútbol 5, 7 for fútbol 7)',
    minimum: 5,
    maximum: 7,
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(7)
  gameType?: number;

  @ApiProperty({
    description:
      'Game skill level (1-5, where 1 is beginner and 5 is professional)',
    minimum: 1,
    maximum: 5,
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  gameLevel?: number;

  @ApiProperty({
    description: 'Game start time in ISO format',
    example: '2024-12-25T18:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiProperty({
    description: 'Game end time in ISO format',
    example: '2024-12-25T19:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiProperty({
    description: 'Total number of spots available for the game',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  totalSpots?: number;

  @ApiProperty({
    description: 'Number of available spots (must be <= totalSpots)',
    example: 8,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Validate(AvailableSpotsNotGreaterThanTotal)
  availableSpots?: number;

  @ApiProperty({
    description: 'Price per player in local currency',
    example: 2500.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  pricePerPlayer?: number;

  @ApiProperty({
    description: 'Current status of the game',
    enum: ['open', 'full', 'cancelled', 'completed'],
    example: 'open',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['open', 'full', 'cancelled', 'completed'])
  status?: string;
}
