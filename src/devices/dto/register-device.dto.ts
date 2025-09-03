import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'Token FCM del dispositivo para recibir notificaciones push',
    example: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciBleGFtcGxl',
    type: String,
    required: true,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
