import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationDto } from './dto/notification.dto';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: 'notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> socketIds[]

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remover el socket de todos los usuarios
    for (const [userId, socketIds] of this.userSockets.entries()) {
      const updatedSocketIds = socketIds.filter((id) => id !== client.id);
      if (updatedSocketIds.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, updatedSocketIds);
      }
    }
  }

  @SubscribeMessage('join')
  handleJoinRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    // Agregar el socket al usuario
    const existingSockets = this.userSockets.get(userId) || [];
    this.userSockets.set(userId, [...existingSockets, client.id]);

    // Unir el socket a una sala personal del usuario
    client.join(`user_${userId}`);

    this.logger.log(
      `User ${userId} joined notifications with socket ${client.id}`,
    );

    // Confirmar la conexión
    client.emit('joined', {
      message: 'Successfully joined notifications',
      userId,
    });
  }

  @SubscribeMessage('leave')
  handleLeaveRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;

    // Remover el socket del usuario
    const existingSockets = this.userSockets.get(userId) || [];
    const updatedSockets = existingSockets.filter((id) => id !== client.id);

    if (updatedSockets.length === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, updatedSockets);
    }

    // Salir de la sala del usuario
    client.leave(`user_${userId}`);

    this.logger.log(
      `User ${userId} left notifications with socket ${client.id}`,
    );
  }

  // Método para enviar notificación a un usuario específico
  sendNotificationToUser(userId: string, notification: NotificationDto) {
    const room = `user_${userId}`;
    this.server.to(room).emit('notification', notification);

    this.logger.log(
      `Notification sent to user ${userId}: ${notification.title}`,
    );
  }

  // Método para notificar cambio en el contador de no leídas
  notifyUnreadCountChange(userId: string) {
    const room = `user_${userId}`;
    this.server.to(room).emit('unread_count_changed', { userId });

    this.logger.log(`Unread count change notification sent to user ${userId}`);
  }

  // Método para obtener usuarios conectados (útil para debugging)
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Método para verificar si un usuario está conectado
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
