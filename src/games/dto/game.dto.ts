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

  @IsString()
  fieldId: string;

  @IsInt()
  @Min(5)
  @Max(7)
  gameType: number;

  @IsInt()
  @Min(1)
  @Max(5)
  gameLevel: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsInt()
  totalSpots: number;

  @IsInt()
  @Validate(AvailableSpotsNotGreaterThanTotal)
  availableSpots: number;

  @IsNumber()
  pricePerPlayer: number;

  @IsString()
  @IsIn(['open', 'full', 'cancelled', 'completed'])
  status: string;
}

export class UpdateGameDto {
  @IsOptional()
  @IsString()
  fieldId?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(7)
  gameType?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  gameLevel?: number;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  totalSpots?: number;

  @IsOptional()
  @IsInt()
  @Validate(AvailableSpotsNotGreaterThanTotal)
  availableSpots?: number;

  @IsOptional()
  @IsNumber()
  pricePerPlayer?: number;

  @IsOptional()
  @IsString()
  @IsIn(['open', 'full', 'cancelled', 'completed'])
  status?: string;
}
