import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import {
  NotificationDto,
  NotificationListResponseDto,
} from './dto/notification.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../decorators/user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener notificaciones del usuario',
    description:
      'Obtiene las notificaciones del usuario autenticado con paginación y filtros opcionales',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (empezando desde 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de notificaciones por página (máximo 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Si es true, solo devuelve notificaciones no leídas',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones obtenida exitosamente',
    type: NotificationListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuario no autenticado',
  })
  async getUserNotifications(
    @CurrentUser() userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('unreadOnly') unreadOnly: string = 'false',
  ): Promise<NotificationListResponseDto> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const unreadOnlyBool = unreadOnly.toLowerCase() === 'true';

    return await this.notificationService.getUserNotifications(
      userId,
      pageNum,
      limitNum,
      unreadOnlyBool,
    );
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Obtener contador de notificaciones no leídas',
    description:
      'Obtiene el número total de notificaciones no leídas del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Contador obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        unreadCount: {
          type: 'number',
          description: 'Número de notificaciones no leídas',
          example: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Usuario no autenticado',
  })
  async getUnreadCount(
    @CurrentUser() userId: string,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    return { unreadCount };
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description: 'Marca una notificación específica como leída',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la notificación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída exitosamente',
    type: NotificationDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuario no autenticado',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para marcar esta notificación',
  })
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser() userId: string,
  ): Promise<NotificationDto> {
    return await this.notificationService.markAsRead(notificationId, userId);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones del usuario como leídas',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las notificaciones marcadas como leídas exitosamente',
    schema: {
      type: 'object',
      properties: {
        updatedCount: {
          type: 'number',
          description:
            'Número de notificaciones que fueron marcadas como leídas',
          example: 3,
        },
        message: {
          type: 'string',
          description: 'Mensaje de confirmación',
          example: 'Se marcaron 3 notificaciones como leídas',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Usuario no autenticado',
  })
  async markAllAsRead(
    @CurrentUser() userId: string,
  ): Promise<{ updatedCount: number; message: string }> {
    const updatedCount = await this.notificationService.markAllAsRead(userId);
    return {
      updatedCount,
      message: `Se marcaron ${updatedCount} notificaciones como leídas`,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener notificación por ID',
    description: 'Obtiene una notificación específica por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la notificación',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación obtenida exitosamente',
    type: NotificationDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuario no autenticado',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificación no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver esta notificación',
  })
  async getNotificationById(
    @Param('id') notificationId: string,
    @CurrentUser() userId: string,
  ): Promise<NotificationDto> {
    return await this.notificationService.getNotificationById(
      notificationId,
      userId,
    );
  }

  @Post('send-fcm-push')
  @ApiOperation({
    summary: 'Send FCM push notification',
    description:
      'Send a push notification using Firebase Cloud Messaging to a specific device token',
  })
  @ApiBody({
    description: 'FCM push notification data',
    schema: {
      type: 'object',
      properties: {
        fcmToken: {
          type: 'string',
          description: 'Firebase Cloud Messaging token of the target device',
          example: 'dGVzdF90b2tlbl8xMjM0NTY3ODkw',
        },
        title: {
          type: 'string',
          description: 'Notification title',
          example: 'Nueva notificación',
        },
        body: {
          type: 'string',
          description: 'Notification body text',
          example: 'Tienes una nueva notificación importante',
        },
        data: {
          type: 'object',
          description: 'Additional data to send with the notification',
          example: {
            type: 'game_reminder',
            gameId: 'game_123',
            timestamp: '2024-01-20T10:00:00Z',
          },
        },
      },
      required: ['fcmToken', 'title', 'body'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Push notification sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Push notification sent successfully',
        },
        messageId: {
          type: 'string',
          example:
            'projects/myproject/messages/0:1234567890123456%31bd1c9631bd1c96',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid FCM token or missing required fields',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        error: {
          type: 'string',
          example: 'Invalid FCM token format',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to send push notification',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        error: {
          type: 'string',
          example: 'Failed to send push notification',
        },
      },
    },
  })
  @ApiBearerAuth()
  async sendFcmPush(
    @Body() body: { fcmToken: string; title: string; body: string; data?: any },
  ): Promise<{
    success: boolean;
    message?: string;
    messageId?: string;
    error?: string;
  }> {
    try {
      const { fcmToken, title, body: messageBody, data } = body;

      if (!fcmToken || !title || !messageBody) {
        return {
          success: false,
          error:
            'Missing required fields: fcmToken, title, and body are required',
        };
      }

      const messageId = await this.notificationService.sendPushNotification(
        fcmToken,
        title,
        messageBody,
        data,
      );

      return {
        success: true,
        message: 'Push notification sent successfully',
        messageId,
      };
    } catch (error) {
      console.error('Error in sendFcmPush controller:', error);
      return {
        success: false,
        error: error.message || 'Failed to send push notification',
      };
    }
  }

  @Post('send-to-user')
  @ApiOperation({
    summary: 'Send push notification to user',
    description:
      'Send a push notification to all devices registered by a specific user',
  })
  @ApiBody({
    description: 'User push notification data',
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID of the target user',
          example: 'user_123',
        },
        title: {
          type: 'string',
          description: 'Notification title',
          example: 'Nueva notificación',
        },
        body: {
          type: 'string',
          description: 'Notification body text',
          example: 'Tienes una nueva notificación importante',
        },
        data: {
          type: 'object',
          description: 'Additional data to send with the notification',
          example: {
            type: 'game_reminder',
            gameId: 'game_123',
            timestamp: '2024-01-20T10:00:00Z',
          },
        },
      },
      required: ['userId', 'title', 'body'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Push notifications sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        message: {
          type: 'string',
          example: 'Push notifications sent to user devices',
        },
        sentCount: {
          type: 'number',
          example: 2,
        },
        failedCount: {
          type: 'number',
          example: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no devices registered',
  })
  @ApiBearerAuth()
  async sendToUser(
    @Body() body: { userId: string; title: string; body: string; data?: any },
  ): Promise<{
    success: boolean;
    message?: string;
    sentCount?: number;
    failedCount?: number;
    error?: string;
  }> {
    try {
      const { userId, title, body: messageBody, data } = body;

      if (!userId || !title || !messageBody) {
        return {
          success: false,
          error:
            'Missing required fields: userId, title, and body are required',
        };
      }

      const result = await this.notificationService.sendPushNotificationsToUser(
        userId,
        title,
        messageBody,
        data,
      );

      return {
        success: true,
        message: 'Push notifications sent to user devices',
        sentCount: result.sentCount,
        failedCount: result.failedCount,
      };
    } catch (error) {
      console.error('Error in sendToUser controller:', error);
      return {
        success: false,
        error: error.message || 'Failed to send push notifications to user',
      };
    }
  }
}
