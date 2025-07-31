import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from '../services/prisma.service';
import {
  CreateNotificationDto,
  NotificationType,
} from './dto/notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockNotificationGateway = {
    sendNotificationToUser: jest.fn(),
    notifyUnreadCountChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationGateway,
          useValue: mockNotificationGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    const createNotificationDto: CreateNotificationDto = {
      userId: 'user123',
      title: 'Test Notification',
      body: 'This is a test notification',
      type: NotificationType.GAME_JOIN,
    };

    const mockCreatedNotification = {
      id: 'notification123',
      userId: 'user123',
      title: 'Test Notification',
      body: 'This is a test notification',
      type: NotificationType.GAME_JOIN,
      read: false,
      createdAt: new Date(),
    };

    it('should create a notification successfully', async () => {
      mockPrismaService.notification.create.mockResolvedValue(
        mockCreatedNotification,
      );

      const result = await service.createNotification(createNotificationDto);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: createNotificationDto.userId,
          title: createNotificationDto.title,
          body: createNotificationDto.body,
          type: createNotificationDto.type,
          read: false,
        },
      });

      expect(
        mockNotificationGateway.sendNotificationToUser,
      ).toHaveBeenCalledWith(
        createNotificationDto.userId,
        expect.objectContaining({
          id: mockCreatedNotification.id,
          title: createNotificationDto.title,
          body: createNotificationDto.body,
          type: createNotificationDto.type,
          read: false,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockCreatedNotification.id,
          title: createNotificationDto.title,
          body: createNotificationDto.body,
          type: createNotificationDto.type,
          read: false,
        }),
      );
    });
  });

  describe('getUserNotifications', () => {
    const userId = 'user123';
    const mockNotifications = [
      {
        id: 'notification1',
        userId,
        title: 'Notification 1',
        body: 'Body 1',
        type: NotificationType.GAME_JOIN,
        read: false,
        createdAt: new Date(),
      },
      {
        id: 'notification2',
        userId,
        title: 'Notification 2',
        body: 'Body 2',
        type: NotificationType.GENERAL,
        read: true,
        createdAt: new Date(),
      },
    ];

    it('should get user notifications with pagination', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );
      mockPrismaService.notification.count
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1); // unread

      const result = await service.getUserNotifications(userId, 1, 10);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        notifications: expect.arrayContaining([
          expect.objectContaining({ id: 'notification1' }),
          expect.objectContaining({ id: 'notification2' }),
        ]),
        total: 2,
        unreadCount: 1,
      });
    });

    it('should filter unread notifications only', async () => {
      const unreadNotifications = [mockNotifications[0]];
      mockPrismaService.notification.findMany.mockResolvedValue(
        unreadNotifications,
      );
      mockPrismaService.notification.count
        .mockResolvedValueOnce(1) // total filtered
        .mockResolvedValueOnce(1); // unread

      const result = await service.getUserNotifications(userId, 1, 10, true);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].read).toBe(false);
    });
  });

  describe('markAsRead', () => {
    const notificationId = 'notification123';
    const userId = 'user123';
    const mockNotification = {
      id: notificationId,
      userId,
      title: 'Test Notification',
      body: 'Test Body',
      type: NotificationType.GAME_JOIN,
      read: false,
      createdAt: new Date(),
    };

    it('should mark notification as read successfully', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.update.mockResolvedValue({
        ...mockNotification,
        read: true,
      });

      const result = await service.markAsRead(notificationId, userId);

      expect(mockPrismaService.notification.findFirst).toHaveBeenCalledWith({
        where: { id: notificationId, userId },
      });

      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { read: true },
      });

      expect(
        mockNotificationGateway.notifyUnreadCountChange,
      ).toHaveBeenCalledWith(userId);

      expect(result.read).toBe(true);
    });

    it('should throw error if notification not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId)).rejects.toThrow(
        'Notificación no encontrada',
      );

      expect(mockPrismaService.notification.update).not.toHaveBeenCalled();
      expect(
        mockNotificationGateway.notifyUnreadCountChange,
      ).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    const userId = 'user123';

    it('should mark all notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead(userId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId, read: false },
        data: { read: true },
      });

      expect(
        mockNotificationGateway.notifyUnreadCountChange,
      ).toHaveBeenCalledWith(userId);

      expect(result).toBe(3);
    });
  });

  describe('getUnreadCount', () => {
    const userId = 'user123';

    it('should return unread notification count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(userId);

      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId, read: false },
      });

      expect(result).toBe(5);
    });
  });

  describe('notifyGameJoin', () => {
    const organizerId = 'organizer123';
    const playerName = 'Juan Pérez';
    const gameDetails = {
      gameId: 'game123',
      gameType: 5,
      startTime: new Date('2024-01-20T15:00:00.000Z'),
    };

    it('should create game join notification', async () => {
      const mockCreatedNotification = {
        id: 'notification123',
        userId: organizerId,
        title: 'Nuevo jugador se unió a tu juego',
        body: expect.stringContaining(playerName),
        type: NotificationType.GAME_JOIN,
        read: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(
        mockCreatedNotification,
      );

      await service.notifyGameJoin(organizerId, playerName, gameDetails);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: organizerId,
          title: 'Nuevo jugador se unió a tu juego',
          body: expect.stringContaining('Juan Pérez'),
          type: NotificationType.GAME_JOIN,
          read: false,
        }),
      });

      expect(
        mockNotificationGateway.sendNotificationToUser,
      ).toHaveBeenCalledWith(
        organizerId,
        expect.objectContaining({
          title: 'Nuevo jugador se unió a tu juego',
          type: NotificationType.GAME_JOIN,
        }),
      );
    });
  });
});
