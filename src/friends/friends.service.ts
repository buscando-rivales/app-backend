import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import {
  AddFriendDto,
  UpdateFriendRequestDto,
  FriendStatus,
  FriendResponseDto,
  FriendListResponseDto,
  PendingRequestsResponseDto,
} from './dto/friend.dto';

@Injectable()
export class FriendsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async addFriend(
    userId: string,
    addFriendDto: AddFriendDto,
  ): Promise<FriendResponseDto> {
    const { friendId } = addFriendDto;

    // Verificar que no sea el mismo usuario
    if (userId === friendId) {
      throw new BadRequestException(
        'No puedes agregarte a ti mismo como amigo',
      );
    }

    // Verificar que el usuario objetivo existe
    const targetUser = await this.prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya existe una relación de amistad
    const existingFriendship = await this.prisma.user_friends.findFirst({
      where: {
        OR: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException(
        'Ya existe una relación de amistad con este usuario',
      );
    }

    // Crear solicitud de amistad
    const friendship = await this.prisma.user_friends.create({
      data: {
        user_id: userId,
        friend_id: friendId,
        status: FriendStatus.PENDING,
      },
      include: {
        users_user_friends_friend_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
        users_user_friends_user_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    // Enviar notificación al usuario objetivo sobre la nueva solicitud
    try {
      await this.notificationService.notifyFriendRequest(
        friendId,
        friendship.users_user_friends_user_idTousers.nickname ||
          friendship.users_user_friends_user_idTousers.fullName,
        userId,
      );
    } catch (error) {
      console.error(
        'Error enviando notificación de solicitud de amistad:',
        error,
      );
    }

    return {
      id: friendship.id,
      user_id: friendship.user_id,
      friend_id: friendship.friend_id,
      status: friendship.status as FriendStatus,
      created_at: friendship.created_at,
      updated_at: friendship.updated_at,
      friend: friendship.users_user_friends_friend_idTousers,
    };
  }

  async updateFriendRequest(
    userId: string,
    requestId: string,
    updateFriendRequestDto: UpdateFriendRequestDto,
  ): Promise<FriendResponseDto> {
    const { status } = updateFriendRequestDto;

    // Buscar la solicitud de amistad donde el usuario actual es el receptor
    const friendRequest = await this.prisma.user_friends.findFirst({
      where: {
        id: requestId,
        friend_id: userId, // El usuario actual debe ser el receptor
        status: FriendStatus.PENDING,
      },
      include: {
        users_user_friends_user_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    if (!friendRequest) {
      throw new NotFoundException(
        'Solicitud de amistad no encontrada o no tienes permisos para actualizarla',
      );
    }

    // Actualizar el estado de la solicitud
    const updatedRequest = await this.prisma.user_friends.update({
      where: { id: requestId },
      data: {
        status,
        updated_at: new Date(),
      },
      include: {
        users_user_friends_user_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    // Si la solicitud fue aceptada, enviar notificación al remitente
    if (status === FriendStatus.ACCEPTED) {
      try {
        // Obtener información del usuario que aceptó la solicitud
        const accepterUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            fullName: true,
            nickname: true,
          },
        });

        if (accepterUser) {
          await this.notificationService.notifyFriendAccept(
            updatedRequest.user_id, // El usuario que envió la solicitud original
            accepterUser.nickname || accepterUser.fullName,
            userId, // El usuario que aceptó
          );
        }
      } catch (error) {
        console.error(
          'Error enviando notificación de aceptación de amistad:',
          error,
        );
      }
    }

    return {
      id: updatedRequest.id,
      user_id: updatedRequest.user_id,
      friend_id: updatedRequest.friend_id,
      status: updatedRequest.status as FriendStatus,
      created_at: updatedRequest.created_at,
      updated_at: updatedRequest.updated_at,
      user: updatedRequest.users_user_friends_user_idTousers,
    };
  }

  async getFriends(userId: string): Promise<FriendListResponseDto> {
    const friends = await this.prisma.user_friends.findMany({
      where: {
        OR: [
          { user_id: userId, status: FriendStatus.ACCEPTED },
          { friend_id: userId, status: FriendStatus.ACCEPTED },
        ],
      },
      include: {
        users_user_friends_user_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
        users_user_friends_friend_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    const formattedFriends = friends.map((friendship) => {
      // Determinar cuál es el amigo (no el usuario actual)
      const friend =
        friendship.user_id === userId
          ? friendship.users_user_friends_friend_idTousers
          : friendship.users_user_friends_user_idTousers;

      return {
        id: friendship.id,
        user_id: friendship.user_id,
        friend_id: friendship.friend_id,
        status: friendship.status as FriendStatus,
        created_at: friendship.created_at,
        updated_at: friendship.updated_at,
        friend,
      };
    });

    return {
      friends: formattedFriends,
      total: formattedFriends.length,
    };
  }

  async getPendingRequests(
    userId: string,
  ): Promise<PendingRequestsResponseDto> {
    // Solicitudes enviadas por el usuario
    const sentRequests = await this.prisma.user_friends.findMany({
      where: {
        user_id: userId,
        status: FriendStatus.PENDING,
      },
      include: {
        users_user_friends_friend_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    // Solicitudes recibidas por el usuario
    const receivedRequests = await this.prisma.user_friends.findMany({
      where: {
        friend_id: userId,
        status: FriendStatus.PENDING,
      },
      include: {
        users_user_friends_user_idTousers: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    const formattedSentRequests = sentRequests.map((request) => ({
      id: request.id,
      user_id: request.user_id,
      friend_id: request.friend_id,
      status: request.status as FriendStatus,
      created_at: request.created_at,
      updated_at: request.updated_at,
      friend: request.users_user_friends_friend_idTousers,
    }));

    const formattedReceivedRequests = receivedRequests.map((request) => ({
      id: request.id,
      user_id: request.user_id,
      friend_id: request.friend_id,
      status: request.status as FriendStatus,
      created_at: request.created_at,
      updated_at: request.updated_at,
      user: request.users_user_friends_user_idTousers,
    }));

    return {
      sentRequests: formattedSentRequests,
      receivedRequests: formattedReceivedRequests,
      totalSent: formattedSentRequests.length,
      totalReceived: formattedReceivedRequests.length,
    };
  }

  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    // Buscar la amistad donde el usuario actual está involucrado
    const friendship = await this.prisma.user_friends.findFirst({
      where: {
        id: friendshipId,
        OR: [{ user_id: userId }, { friend_id: userId }],
      },
    });

    if (!friendship) {
      throw new NotFoundException(
        'Amistad no encontrada o no tienes permisos para eliminarla',
      );
    }

    await this.prisma.user_friends.delete({
      where: { id: friendshipId },
    });
  }
}
