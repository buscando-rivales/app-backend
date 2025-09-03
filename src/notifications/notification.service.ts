import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import {
  CreateNotificationDto,
  NotificationDto,
  NotificationListResponseDto,
  NotificationType,
} from './dto/notification.dto';
import { NotificationGateway } from './notification.gateway';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class NotificationService {
  private firebaseApp: admin.app.App;

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private metricsService: MetricsService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Verificar si ya existe una app de Firebase
      try {
        this.firebaseApp = admin.app(); // Usar la app existente
        console.log('Firebase Admin SDK usando app existente');
        return;
      } catch (error) {
        // Si no existe, crear una nueva
      }

      const serviceAccountPath = path.join(
        __dirname,
        '..',
        'serviceAccountkey.json',
      );
      const serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountPath, 'utf8'),
      );

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('Error inicializando Firebase Admin SDK:', error);
      throw new Error('No se pudo inicializar Firebase Admin SDK');
    }
  }

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

    // Loguear métrica de notificación enviada
    try {
      await this.metricsService.logNotificationSent({
        userId: createNotificationDto.userId,
        notificationType: createNotificationDto.type,
        notificationTitle: createNotificationDto.title,
        deliveryMethod: 'websocket',
        success: true,
      });
    } catch (error) {
      console.error('Error logging notification sent metric:', error);
    }

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

  /**
   * Envía una notificación push usando Firebase Cloud Messaging
   * @param token Token FCM del dispositivo del usuario
   * @param title Título de la notificación
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales opcionales
   * @returns Promise<string> ID del mensaje enviado
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string> {
    try {
      if (!token || !title || !body) {
        throw new Error('Token, título y cuerpo son requeridos');
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token,
      };

      const response = await admin.messaging().send(message);

      console.log('Notificación push enviada exitosamente:', response);

      // Loguear métrica de notificación push enviada
      try {
        await this.metricsService.logNotificationSent({
          userId: 'unknown', // Se puede mejorar pasando el userId como parámetro
          notificationType: 'PUSH',
          notificationTitle: title,
          deliveryMethod: 'firebase_fcm',
          success: true,
        });
      } catch (metricError) {
        console.error('Error logging push notification metric:', metricError);
      }

      return response;
    } catch (error) {
      console.error('Error enviando notificación push:', error);

      // Loguear métrica de error
      try {
        await this.metricsService.logNotificationSent({
          userId: 'unknown',
          notificationType: 'PUSH',
          notificationTitle: title,
          deliveryMethod: 'firebase_fcm',
          success: false,
        });
      } catch (metricError) {
        console.error(
          'Error logging failed push notification metric:',
          metricError,
        );
      }

      throw new Error(`Error enviando notificación push: ${error.message}`);
    }
  }
}
