import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import {
  CreateNotificationDto,
  NotificationDto,
  NotificationListResponseDto,
  NotificationType,
} from './dto/notification.dto';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        title: createNotificationDto.title,
        body: createNotificationDto.body,
        type: createNotificationDto.type,
        read: false,
      },
    });

    const formattedNotification: NotificationDto = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type as NotificationType,
      read: notification.read,
      createdAt: notification.createdAt,
      data: createNotificationDto.data,
    };

    // Enviar notificación en tiempo real via WebSocket
    this.notificationGateway.sendNotificationToUser(
      createNotificationDto.userId,
      formattedNotification,
    );

    return formattedNotification;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<NotificationListResponseDto> {
    const skip = (page - 1) * limit;

    const whereCondition = { userId, ...(unreadOnly && { read: false }) };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: whereCondition,
      }),
      this.prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    const formattedNotifications: NotificationDto[] = notifications.map(
      (notification) => ({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type as NotificationType,
        read: notification.read,
        createdAt: notification.createdAt,
      }),
    );

    return {
      notifications: formattedNotifications,
      total,
      unreadCount,
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId, // Asegurar que solo el dueño pueda marcar como leída
      },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    // Notificar al usuario sobre el cambio de estado
    this.notificationGateway.notifyUnreadCountChange(userId);

    return {
      id: updatedNotification.id,
      userId: updatedNotification.userId,
      title: updatedNotification.title,
      body: updatedNotification.body,
      type: updatedNotification.type as NotificationType,
      read: updatedNotification.read,
      createdAt: updatedNotification.createdAt,
    };
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    // Notificar al usuario sobre el cambio de estado
    this.notificationGateway.notifyUnreadCountChange(userId);

    return result.count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<NotificationDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId, // Asegurar que solo el dueño pueda ver la notificación
      },
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type as NotificationType,
      read: notification.read,
      createdAt: notification.createdAt,
    };
  }

  // Métodos específicos para diferentes tipos de notificaciones

  async notifyGameJoin(
    organizerId: string,
    playerName: string,
    gameDetails: { gameId: string; gameType: number; startTime: Date },
  ): Promise<void> {
    const gameTypeText = gameDetails.gameType === 5 ? 'fútbol 5' : 'fútbol 7';
    const formattedDate = gameDetails.startTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.createNotification({
      userId: organizerId,
      title: 'Nuevo jugador se unió a tu juego',
      body: `${playerName} se unió a tu juego de ${gameTypeText} el ${formattedDate}`,
      type: NotificationType.GAME_JOIN,
      data: {
        gameId: gameDetails.gameId,
        playerName,
        gameType: gameDetails.gameType,
      },
    });
  }

  async notifyGameLeave(
    organizerId: string,
    playerName: string,
    gameDetails: { gameId: string; gameType: number; startTime: Date },
  ): Promise<void> {
    const gameTypeText = gameDetails.gameType === 5 ? 'fútbol 5' : 'fútbol 7';
    const formattedDate = gameDetails.startTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.createNotification({
      userId: organizerId,
      title: 'Un jugador abandonó tu juego',
      body: `${playerName} abandonó tu juego de ${gameTypeText} el ${formattedDate}`,
      type: NotificationType.GAME_LEAVE,
      data: {
        gameId: gameDetails.gameId,
        playerName,
        gameType: gameDetails.gameType,
      },
    });
  }

  async notifyGameKick(
    playerId: string,
    gameDetails: { gameId: string; gameType: number; startTime: Date },
  ): Promise<void> {
    const gameTypeText = gameDetails.gameType === 5 ? 'fútbol 5' : 'fútbol 7';
    const formattedDate = gameDetails.startTime.toLocaleDateString('es-ES', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.createNotification({
      userId: playerId,
      title: 'Fuiste expulsado de un juego',
      body: `Has sido expulsado del juego de ${gameTypeText} el ${formattedDate}`,
      type: NotificationType.GAME_KICK,
      data: {
        gameId: gameDetails.gameId,
        gameType: gameDetails.gameType,
      },
    });
  }

  async notifyFriendRequest(
    receiverId: string,
    senderName: string,
    senderId: string,
  ): Promise<void> {
    await this.createNotification({
      userId: receiverId,
      title: 'Nueva solicitud de amistad',
      body: `${senderName} te ha enviado una solicitud de amistad`,
      type: NotificationType.FRIEND_REQUEST,
      data: {
        senderId,
        senderName,
      },
    });
  }

  async notifyFriendAccept(
    senderId: string,
    accepterName: string,
    accepterId: string,
  ): Promise<void> {
    await this.createNotification({
      userId: senderId,
      title: 'Solicitud de amistad aceptada',
      body: `${accepterName} aceptó tu solicitud de amistad`,
      type: NotificationType.FRIEND_ACCEPT,
      data: {
        accepterId,
        accepterName,
      },
    });
  }
}
