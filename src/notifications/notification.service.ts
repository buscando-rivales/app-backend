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
        console.error('Error obteniendo app Firebase existente:', error);
        // Si no existe, crear una nueva
      }

      const serviceAccountPath = path.join(__dirname, 'serviceAccountkey.json');
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

    // Enviar notificación push a través de Firebase
    const data = {
      notificationId: notification.id,
      notificationType: notification.type,
      ...(createNotificationDto.data || {}),
    };

    await this.sendPushNotificationsToUser(
      createNotificationDto.userId,
      createNotificationDto.title,
      createNotificationDto.body,
      data,
    );

    // Loguear métrica de notificación enviada
    try {
      await this.metricsService.logNotificationSent({
        userId: createNotificationDto.userId,
        notificationType: createNotificationDto.type,
        notificationTitle: createNotificationDto.title,
        deliveryMethod: 'firebase_fcm',
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

    // Notificar al usuario sobre el cambio de estado mediante push
    await this.sendPushNotificationsToUser(
      userId,
      'Notificaciones actualizadas',
      'Se ha actualizado el estado de tus notificaciones',
      {
        action: 'unread_count_changed',
        notificationId,
      },
    );

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

    // Notificar al usuario sobre el cambio de estado mediante push
    await this.sendPushNotificationsToUser(
      userId,
      'Notificaciones actualizadas',
      'Todas tus notificaciones han sido marcadas como leídas',
      {
        action: 'all_read',
        count: result.count.toString(),
      },
    );

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

    const title = 'Nuevo jugador se unió a tu juego';
    const body = `${playerName} se unió a tu juego de ${gameTypeText} el ${formattedDate}`;
    const data = {
      gameId: gameDetails.gameId,
      playerName,
      gameType: gameDetails.gameType.toString(),
      notificationType: NotificationType.GAME_JOIN,
    };

    // Enviar notificación push en lugar de WebSocket
    await this.sendPushNotificationsToUser(organizerId, title, body, data);

    // También crear la notificación en la base de datos para historial
    await this.prisma.notification.create({
      data: {
        userId: organizerId,
        title,
        body,
        type: NotificationType.GAME_JOIN,
        read: false,
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

    const title = 'Un jugador abandonó tu juego';
    const body = `${playerName} abandonó tu juego de ${gameTypeText} el ${formattedDate}`;
    const data = {
      gameId: gameDetails.gameId,
      playerName,
      gameType: gameDetails.gameType.toString(),
      notificationType: NotificationType.GAME_LEAVE,
    };

    // Enviar notificación push en lugar de WebSocket
    await this.sendPushNotificationsToUser(organizerId, title, body, data);

    // También crear la notificación en la base de datos para historial
    await this.prisma.notification.create({
      data: {
        userId: organizerId,
        title,
        body,
        type: NotificationType.GAME_LEAVE,
        read: false,
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

    const title = 'Fuiste expulsado de un juego';
    const body = `Has sido expulsado del juego de ${gameTypeText} el ${formattedDate}`;
    const data = {
      gameId: gameDetails.gameId,
      gameType: gameDetails.gameType.toString(),
      notificationType: NotificationType.GAME_KICK,
    };

    // Enviar notificación push en lugar de WebSocket
    await this.sendPushNotificationsToUser(playerId, title, body, data);

    // También crear la notificación en la base de datos para historial
    await this.prisma.notification.create({
      data: {
        userId: playerId,
        title,
        body,
        type: NotificationType.GAME_KICK,
        read: false,
      },
    });
  }

  async notifyFriendRequest(
    receiverId: string,
    senderName: string,
    senderId: string,
  ): Promise<void> {
    const title = 'Nueva solicitud de amistad';
    const body = `${senderName} te ha enviado una solicitud de amistad`;
    const data = {
      senderId,
      senderName,
      notificationType: NotificationType.FRIEND_REQUEST,
    };

    // Enviar notificación push en lugar de WebSocket
    await this.sendPushNotificationsToUser(receiverId, title, body, data);

    // También crear la notificación en la base de datos para historial
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        title,
        body,
        type: NotificationType.FRIEND_REQUEST,
        read: false,
      },
    });
  }

  async notifyFriendAccept(
    senderId: string,
    accepterName: string,
    accepterId: string,
  ): Promise<void> {
    const title = 'Solicitud de amistad aceptada';
    const body = `${accepterName} aceptó tu solicitud de amistad`;
    const data = {
      accepterId,
      accepterName,
      notificationType: NotificationType.FRIEND_ACCEPT,
    };

    // Enviar notificación push en lugar de WebSocket
    await this.sendPushNotificationsToUser(senderId, title, body, data);

    // También crear la notificación en la base de datos para historial
    await this.prisma.notification.create({
      data: {
        userId: senderId,
        title,
        body,
        type: NotificationType.FRIEND_ACCEPT,
        read: false,
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

  /**
   * Obtiene todos los tokens FCM registrados para un usuario
   * @param userId ID del usuario
   * @returns Promise<string[]> Lista de tokens FCM
   */
  async getUserFcmTokens(userId: string): Promise<string[]> {
    const devices = await this.prisma.user_devices.findMany({
      where: { user_id: userId },
      select: { fcm_token: true },
    });

    return devices.map((device) => device.fcm_token).filter(Boolean);
  }

  /**
   * Elimina un token FCM inválido de la base de datos
   * @param token Token FCM inválido
   */
  async removeInvalidFcmToken(token: string): Promise<void> {
    try {
      await this.prisma.user_devices.deleteMany({
        where: { fcm_token: token },
      });
      console.log(`Token FCM inválido eliminado: ${token.substring(0, 10)}...`);
    } catch (error) {
      console.error('Error eliminando token FCM inválido:', error);
    }
  }

  /**
   * Envía notificaciones push a todos los dispositivos de un usuario
   * @param userId ID del usuario
   * @param title Título de la notificación
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales opcionales
   */
  async sendPushNotificationsToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ sentCount: number; failedCount: number }> {
    try {
      const tokens = await this.getUserFcmTokens(userId);

      if (tokens.length === 0) {
        console.log(`No se encontraron tokens FCM para el usuario ${userId}`);
        return { sentCount: 0, failedCount: 0 };
      }

      console.log(
        `Enviando notificación push a ${tokens.length} dispositivos del usuario ${userId}`,
      );

      let sentCount = 0;
      let failedCount = 0;

      // Enviar notificación a cada token (en paralelo)
      const pushPromises = tokens.map(async (token) => {
        try {
          await this.sendPushNotification(token, title, body, data);
          sentCount++;
        } catch (error) {
          // Los errores ya se manejan en sendPushNotification
          console.warn(
            `Error enviando push a token ${token.substring(0, 20)}...`,
          );
          failedCount++;

          // Si el error es por token inválido, eliminarlo
          if (
            error.message &&
            (error.message.includes('not a valid FCM') ||
              error.message.includes('unregistered') ||
              error.message.includes('invalid-registration-token') ||
              (error.errorInfo &&
                error.errorInfo.code ===
                  'messaging/registration-token-not-registered'))
          ) {
            await this.removeInvalidFcmToken(token);
          }
        }
      });

      await Promise.allSettled(pushPromises);

      console.log(
        `Notificaciones enviadas al usuario ${userId}. Exitosas: ${sentCount}, Fallidas: ${failedCount}`,
      );

      return { sentCount, failedCount };
    } catch (error) {
      console.error(
        `Error enviando notificaciones push al usuario ${userId}:`,
        error,
      );
      throw error;
    }
  }
}
