import { ApiProperty } from '@nestjs/swagger';

export class DeviceResponseDto {
  @ApiProperty({
    description: 'ID único del dispositivo',
    example: 'uuid-device-id',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'ID del usuario propietario del dispositivo',
    example: 'uuid-user-id',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Token FCM del dispositivo',
    example: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciBleGFtcGxl',
    type: String,
  })
  fcmToken: string;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2024-01-15T10:30:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de último uso del dispositivo',
    example: '2024-01-15T10:30:00Z',
    type: Date,
  })
  lastUsed: Date;
}

export class RegisterDeviceResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
    type: Boolean,
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    example: 'Device registered successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Información del dispositivo registrado (opcional)',
    type: DeviceResponseDto,
    required: false,
  })
  device?: DeviceResponseDto;
}