import { IsUUID, IsNotEmpty } from 'class-validator';

export class UserSportPositionDto {
  user_id: string;
  position_id: string;
  position: {
    id: string;
    name: string;
    type: string;
    sport: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export class CreateUserSportPositionDto {
  @IsUUID()
  @IsNotEmpty()
  position_id: string;
}

export class UpdateUserSportPositionDto {
  @IsUUID()
  @IsNotEmpty()
  position_id: string;
}
