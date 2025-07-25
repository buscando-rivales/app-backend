import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
