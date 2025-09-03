import { Injectable, Logger } from '@nestjs/common';
import { RegisterDeviceResponseDto } from './dto';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private prisma: PrismaService) {}

  async registerDevice(
    userId: string,
    fcmToken: string,
  ): Promise<RegisterDeviceResponseDto> {
    try {
      // Verificar si el token ya existe para este usuario
      const existingDevice = await this.prisma.user_devices.findFirst({
        where: {
          user_id: userId,
          fcm_token: fcmToken,
        },
      });

      if (existingDevice) {
        // Actualizar la fecha de último uso
        const updatedDevice = await this.prisma.user_devices.update({
          where: { id: existingDevice.id },
          data: { last_used: new Date() },
        });

        this.logger.log(`Device token updated for user ${userId}`);

        return {
          success: true,
          message: 'Device token updated successfully',
          device: {
            id: updatedDevice.id,
            userId: updatedDevice.user_id,
            fcmToken: updatedDevice.fcm_token,
            createdAt: updatedDevice.created_at,
            lastUsed: updatedDevice.last_used,
          },
        };
      }

      // Crear nuevo registro de dispositivo
      const newDevice = await this.prisma.user_devices.create({
        data: {
          user_id: userId,
          fcm_token: fcmToken,
          created_at: new Date(),
          last_used: new Date(),
        },
      });

      this.logger.log(`New device registered for user ${userId}`);

      return {
        success: true,
        message: 'Device registered successfully',
        device: {
          id: newDevice.id,
          userId: newDevice.user_id,
          fcmToken: newDevice.fcm_token,
          createdAt: newDevice.created_at,
          lastUsed: newDevice.last_used,
        },
      };
    } catch (error) {
      this.logger.error(`Error registering device for user ${userId}:`, error);
      return {
        success: false,
        message: 'Failed to register device',
      };
    }
  }
}
