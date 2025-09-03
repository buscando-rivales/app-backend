import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, RegisterDeviceResponseDto } from './dto';
import { ClerkAuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/decorators/user.decorator';

@ApiTags('Devices')
@ApiBearerAuth()
@Controller('devices')
@UseGuards(ClerkAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar dispositivo FCM',
    description:
      'Registra o actualiza el token FCM de un dispositivo para el usuario autenticado. Si el token ya existe, actualiza la fecha de último uso.',
  })
  @ApiBody({
    type: RegisterDeviceDto,
    description: 'Token FCM del dispositivo a registrar',
    examples: {
      example1: {
        summary: 'Ejemplo de registro de dispositivo',
        value: {
          fcmToken: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciBleGFtcGxl',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Dispositivo registrado o actualizado exitosamente',
    type: RegisterDeviceResponseDto,
    examples: {
      success: {
        summary: 'Registro exitoso',
        value: {
          success: true,
          message: 'Device registered successfully',
          device: {
            id: 'uuid-device-id',
            userId: 'uuid-user-id',
            fcmToken: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciBleGFtcGxl',
            createdAt: '2024-01-15T10:30:00Z',
            lastUsed: '2024-01-15T10:30:00Z',
          },
        },
      },
      updated: {
        summary: 'Token actualizado',
        value: {
          success: true,
          message: 'Device token updated successfully',
          device: {
            id: 'uuid-device-id',
            userId: 'uuid-user-id',
            fcmToken: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2VuIGZvciBleGFtcGxl',
            createdAt: '2024-01-10T08:15:00Z',
            lastUsed: '2024-01-15T10:30:00Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token FCM inválido o datos de entrada incorrectos',
    examples: {
      invalidToken: {
        summary: 'Token inválido',
        value: {
          success: false,
          message: 'Failed to register device',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token de autenticación requerido',
  })
  async registerDevice(
    @CurrentUser() userId: string,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ): Promise<RegisterDeviceResponseDto> {
    return this.devicesService.registerDevice(
      userId,
      registerDeviceDto.fcmToken,
    );
  }
}
