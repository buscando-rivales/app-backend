export class SportDto {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: Date;
}

export class PositionDto {
  id: string;
  name: string;
  type: string;
  sport_id: string;
}

export class SportWithPositionsDto extends SportDto {
  positions: PositionDto[];
}
