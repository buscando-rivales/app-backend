import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../services/prisma.service';
import { MetricEventType } from './dto/metric.dto';

describe('MetricsService', () => {
  let service: MetricsService;

  const mockPrismaService = {
    metric: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Mock console.error y Logger para suprimir logs durante tests
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock del Logger de NestJS
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);

    // Reemplazar el logger del servicio con nuestro mock
    (service as any).logger = mockLogger;

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restaurar console.error después de cada test
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logMetric', () => {
    it('should log a metric successfully', async () => {
      const eventType = MetricEventType.USER_LOGGED_IN;
      const eventData = { userId: 'user123', userAgent: 'test-agent' };

      mockPrismaService.metric.create.mockResolvedValue({
        id: 'metric123',
        eventType,
        eventData,
        createdAt: new Date(),
      });

      await service.logMetric(eventType, eventData);

      expect(mockPrismaService.metric.create).toHaveBeenCalledWith({
        data: {
          eventType,
          eventData,
        },
      });
    });

    it('should handle errors gracefully when logging metrics', async () => {
      const eventType = MetricEventType.USER_LOGGED_IN;
      const eventData = { userId: 'user123' };

      mockPrismaService.metric.create.mockRejectedValue(
        new Error('Database error'),
      );

      // No debería lanzar error
      await expect(
        service.logMetric(eventType, eventData),
      ).resolves.not.toThrow();
    });
  });

  describe('logUserLogin', () => {
    it('should log user login metric', async () => {
      const loginData = {
        userId: 'user123',
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
        loginMethod: 'clerk',
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logUserLogin(loginData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.USER_LOGGED_IN,
        loginData,
      );
    });
  });

  describe('logUserSignUp', () => {
    it('should log user sign up metric', async () => {
      const signUpData = {
        userId: 'user123',
        email: 'test@example.com',
        signUpMethod: 'clerk',
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logUserSignUp(signUpData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.USER_SIGNED_UP,
        signUpData,
      );
    });
  });

  describe('logUserUpdatedProfile', () => {
    it('should log user profile update metric', async () => {
      const updateData = {
        userId: 'user123',
        fieldsUpdated: ['nickname', 'phone'],
        previousValues: { nickname: 'old', phone: null },
        newValues: { nickname: 'new', phone: '123456789' },
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logUserUpdatedProfile(updateData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.USER_UPDATED_PROFILE,
        updateData,
      );
    });
  });

  describe('logSearchNearbyGames', () => {
    it('should log search nearby games metric', async () => {
      const searchData = {
        userId: 'user123',
        searchCriteria: {
          latitude: -34.6037,
          longitude: -58.3816,
          radius: 10,
          gameType: 1,
        },
        resultsCount: 5,
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logSearchNearbyGames(searchData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.SEARCH_NEARBY_GAMES,
        searchData,
      );
    });
  });

  describe('logUserSentFriendRequest', () => {
    it('should log friend request sent metric', async () => {
      const friendRequestData = {
        senderId: 'user123',
        receiverId: 'user456',
        senderName: 'Sender User',
        receiverName: 'Receiver User',
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logUserSentFriendRequest(friendRequestData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.USER_SENT_FRIEND_REQUEST,
        friendRequestData,
      );
    });
  });

  describe('logUserAcceptedFriendRequest', () => {
    it('should log friend request accepted metric', async () => {
      const acceptData = {
        accepterId: 'user456',
        requesterId: 'user123',
        accepterName: 'Accepter User',
        requesterName: 'Requester User',
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logUserAcceptedFriendRequest(acceptData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.USER_ACCEPTED_FRIEND_REQUEST,
        acceptData,
      );
    });
  });

  describe('logUserRejectedFriendRequest', () => {
    it('should log friend request rejected metric', async () => {
      const rejectData = {
        rejecterId: 'user456',
        requesterId: 'user123',
        rejecterName: 'Rejecter User',
        requesterName: 'Requester User',
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logUserRejectedFriendRequest(rejectData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.USER_REJECTED_FRIEND_REQUEST,
        rejectData,
      );
    });
  });

  describe('logNotificationSent', () => {
    it('should log notification sent metric', async () => {
      const notificationData = {
        userId: 'user123',
        notificationType: 'friend_request',
        notificationTitle: 'Nueva solicitud de amistad',
        deliveryMethod: 'websocket' as const,
        success: true,
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logNotificationSent(notificationData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.NOTIFICATION_SENT,
        notificationData,
      );
    });
  });

  describe('logChatMessageSent', () => {
    it('should log chat message sent metric', async () => {
      const messageData = {
        userId: 'user123',
        roomId: 'room456',
        messageLength: 25,
        gameId: 'game789',
      };

      const logMetricSpy = jest.spyOn(service, 'logMetric').mockResolvedValue();

      await service.logChatMessageSent(messageData);

      expect(logMetricSpy).toHaveBeenCalledWith(
        MetricEventType.CHAT_MESSAGE_SENT,
        messageData,
      );
    });
  });

  describe('getMetrics', () => {
    it('should return metrics with filters', async () => {
      const mockMetrics = [
        {
          id: 'metric1',
          eventType: MetricEventType.USER_LOGGED_IN,
          eventData: { userId: 'user123' },
          createdAt: new Date(),
        },
      ];

      mockPrismaService.metric.findMany.mockResolvedValue(mockMetrics);
      mockPrismaService.metric.count.mockResolvedValue(1);

      const query = {
        eventType: MetricEventType.USER_LOGGED_IN,
        userId: 'user123',
        limit: 10,
        offset: 0,
      };

      const result = await service.getMetrics(query);

      expect(result).toEqual({
        metrics: mockMetrics,
        total: 1,
        limit: 10,
        offset: 0,
      });

      expect(mockPrismaService.metric.findMany).toHaveBeenCalledWith({
        where: {
          eventType: MetricEventType.USER_LOGGED_IN,
          eventData: {
            path: ['userId'],
            equals: 'user123',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('getMetricsSummary', () => {
    it('should return metrics summary', async () => {
      mockPrismaService.metric.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // today
        .mockResolvedValueOnce(50) // this week
        .mockResolvedValueOnce(80); // this month

      const result = await service.getMetricsSummary();

      expect(result).toEqual({
        total: 100,
        today: 10,
        thisWeek: 50,
        thisMonth: 80,
      });
    });
  });

  describe('getEventTypeDistribution', () => {
    it('should return event type distribution', async () => {
      const mockDistribution = [
        {
          eventType: MetricEventType.USER_LOGGED_IN,
          _count: { eventType: 50 },
        },
        {
          eventType: MetricEventType.USER_SIGNED_UP,
          _count: { eventType: 20 },
        },
      ];

      mockPrismaService.metric.groupBy.mockResolvedValue(mockDistribution);

      const result = await service.getEventTypeDistribution();

      expect(result).toEqual([
        { eventType: MetricEventType.USER_LOGGED_IN, count: 50 },
        { eventType: MetricEventType.USER_SIGNED_UP, count: 20 },
      ]);
    });
  });
});
