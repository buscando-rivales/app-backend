import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { PrismaService } from '../services/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { MetricsService } from '../metrics/metrics.service';
import { FriendStatus } from './dto/friend.dto';

describe('FriendsService', () => {
  let service: FriendsService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    user_friends: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockNotificationService = {
    notifyFriendRequest: jest.fn(),
    notifyFriendAccept: jest.fn(),
  };

  const mockMetricsService = {
    logUserSentFriendRequest: jest.fn(() => Promise.resolve()),
    logUserAcceptedFriendRequest: jest.fn(() => Promise.resolve()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFriend', () => {
    const userId = 'user1';
    const friendId = 'user2';
    const addFriendDto = { friendId };

    it('should add a friend successfully', async () => {
      const mockUser = { id: friendId, fullName: 'Friend User' };
      const mockFriendship = {
        id: 'friendship1',
        user_id: userId,
        friend_id: friendId,
        status: FriendStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
        users_user_friends_friend_idTousers: {
          id: friendId,
          fullName: 'Friend User',
          nickname: null,
          avatarUrl: null,
          rating: null,
        },
        users_user_friends_user_idTousers: {
          id: userId,
          fullName: 'Current User',
          nickname: 'currentuser',
          avatarUrl: null,
          rating: null,
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user_friends.findFirst.mockResolvedValue(null);
      mockPrismaService.user_friends.create.mockResolvedValue(mockFriendship);

      const result = await service.addFriend(userId, addFriendDto);

      expect(result.status).toBe(FriendStatus.PENDING);
      expect(result.friend_id).toBe(friendId);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: friendId },
      });
      expect(mockPrismaService.user_friends.create).toHaveBeenCalled();
      expect(mockNotificationService.notifyFriendRequest).toHaveBeenCalledWith(
        friendId,
        'currentuser',
        userId,
      );
    });

    it('should throw BadRequestException when user tries to add themselves', async () => {
      await expect(
        service.addFriend(userId, { friendId: userId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.addFriend(userId, addFriendDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when friendship already exists', async () => {
      const mockUser = { id: friendId, fullName: 'Friend User' };
      const existingFriendship = { id: 'existing' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user_friends.findFirst.mockResolvedValue(
        existingFriendship,
      );

      await expect(service.addFriend(userId, addFriendDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateFriendRequest', () => {
    const userId = 'user1';
    const requestId = 'request1';
    const updateDto = { status: FriendStatus.ACCEPTED };

    it('should update friend request successfully', async () => {
      const mockAccepterUser = {
        fullName: 'Current User',
        nickname: 'currentuser',
      };

      const mockRequest = {
        id: requestId,
        user_id: 'user2',
        friend_id: userId,
        status: FriendStatus.PENDING,
        users_user_friends_user_idTousers: {
          id: 'user2',
          fullName: 'Sender User',
          nickname: null,
          avatarUrl: null,
          rating: null,
        },
      };

      const mockUpdatedRequest = {
        ...mockRequest,
        status: FriendStatus.ACCEPTED,
        updated_at: new Date(),
      };

      mockPrismaService.user_friends.findFirst.mockResolvedValue(mockRequest);
      mockPrismaService.user.findUnique.mockResolvedValue(mockAccepterUser);
      mockPrismaService.user_friends.update.mockResolvedValue(
        mockUpdatedRequest,
      );

      const result = await service.updateFriendRequest(
        userId,
        requestId,
        updateDto,
      );

      expect(result.status).toBe(FriendStatus.ACCEPTED);
      expect(mockPrismaService.user_friends.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: {
          status: FriendStatus.ACCEPTED,
          updated_at: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(mockNotificationService.notifyFriendAccept).toHaveBeenCalledWith(
        'user2',
        'currentuser',
        userId,
      );
    });

    it('should throw NotFoundException when request does not exist', async () => {
      mockPrismaService.user_friends.findFirst.mockResolvedValue(null);

      await expect(
        service.updateFriendRequest(userId, requestId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFriends', () => {
    const userId = 'user1';

    it('should return list of friends', async () => {
      const mockFriendships = [
        {
          id: 'friendship1',
          user_id: userId,
          friend_id: 'user2',
          status: FriendStatus.ACCEPTED,
          created_at: new Date(),
          updated_at: new Date(),
          users_user_friends_user_idTousers: null,
          users_user_friends_friend_idTousers: {
            id: 'user2',
            fullName: 'Friend User',
            nickname: null,
            avatarUrl: null,
            rating: null,
          },
        },
      ];

      mockPrismaService.user_friends.findMany.mockResolvedValue(
        mockFriendships,
      );

      const result = await service.getFriends(userId);

      expect(result.friends).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.friends[0].friend?.fullName).toBe('Friend User');
    });
  });

  describe('getPendingRequests', () => {
    const userId = 'user1';

    it('should return pending requests', async () => {
      const mockSentRequests = [
        {
          id: 'sent1',
          user_id: userId,
          friend_id: 'user2',
          status: FriendStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
          users_user_friends_friend_idTousers: {
            id: 'user2',
            fullName: 'Target User',
            nickname: null,
            avatarUrl: null,
            rating: null,
          },
        },
      ];

      const mockReceivedRequests = [
        {
          id: 'received1',
          user_id: 'user3',
          friend_id: userId,
          status: FriendStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
          users_user_friends_user_idTousers: {
            id: 'user3',
            fullName: 'Sender User',
            nickname: null,
            avatarUrl: null,
            rating: null,
          },
        },
      ];

      mockPrismaService.user_friends.findMany
        .mockResolvedValueOnce(mockSentRequests)
        .mockResolvedValueOnce(mockReceivedRequests);

      const result = await service.getPendingRequests(userId);

      expect(result.sentRequests).toHaveLength(1);
      expect(result.receivedRequests).toHaveLength(1);
      expect(result.totalSent).toBe(1);
      expect(result.totalReceived).toBe(1);
    });
  });

  describe('removeFriend', () => {
    const userId = 'user1';
    const friendshipId = 'friendship1';

    it('should remove friend successfully', async () => {
      const mockFriendship = {
        id: friendshipId,
        user_id: userId,
        friend_id: 'user2',
        status: FriendStatus.ACCEPTED,
      };

      mockPrismaService.user_friends.findFirst.mockResolvedValue(
        mockFriendship,
      );
      mockPrismaService.user_friends.delete.mockResolvedValue(mockFriendship);

      await service.removeFriend(userId, friendshipId);

      expect(mockPrismaService.user_friends.delete).toHaveBeenCalledWith({
        where: { id: friendshipId },
      });
    });

    it('should throw NotFoundException when friendship does not exist', async () => {
      mockPrismaService.user_friends.findFirst.mockResolvedValue(null);

      await expect(service.removeFriend(userId, friendshipId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
