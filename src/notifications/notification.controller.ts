import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
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
}
