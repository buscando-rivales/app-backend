import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { MetricEventType } from './dto/metric.dto';

describe('MetricsController', () => {
  let controller: MetricsController;

  const mockMetricsService = {
    getMetrics: jest.fn(),
    getMetricsSummary: jest.fn(),
    getEventTypeDistribution: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<MetricsController>(MetricsController);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics with query parameters', async () => {
      const mockResponse = {
        metrics: [
          {
            id: 'metric1',
            eventType: MetricEventType.USER_LOGGED_IN,
            eventData: { userId: 'user123' },
            createdAt: new Date(),
          },
        ],
        total: 1,
        limit: 100,
        offset: 0,
      };

      const query = {
        eventType: MetricEventType.USER_LOGGED_IN,
        userId: 'user123',
        limit: 100,
        offset: 0,
      };

      mockMetricsService.getMetrics.mockResolvedValue(mockResponse);

      const result = await controller.getMetrics(query);

      expect(result).toEqual(mockResponse);
      expect(mockMetricsService.getMetrics).toHaveBeenCalledWith(query);
    });
  });

  describe('getMetricsSummary', () => {
    it('should return metrics summary', async () => {
      const mockSummary = {
        total: 100,
        today: 10,
        thisWeek: 50,
        thisMonth: 80,
      };

      mockMetricsService.getMetricsSummary.mockResolvedValue(mockSummary);

      const result = await controller.getMetricsSummary();

      expect(result).toEqual(mockSummary);
      expect(mockMetricsService.getMetricsSummary).toHaveBeenCalledWith(
        undefined,
      );
    });

    it('should return metrics summary with event type filter', async () => {
      const mockSummary = {
        total: 50,
        today: 5,
        thisWeek: 25,
        thisMonth: 40,
      };

      const eventType = MetricEventType.USER_LOGGED_IN;

      mockMetricsService.getMetricsSummary.mockResolvedValue(mockSummary);

      const result = await controller.getMetricsSummary(eventType);

      expect(result).toEqual(mockSummary);
      expect(mockMetricsService.getMetricsSummary).toHaveBeenCalledWith(
        eventType,
      );
    });
  });

  describe('getEventTypeDistribution', () => {
    it('should return event type distribution', async () => {
      const mockDistribution = [
        { eventType: MetricEventType.USER_LOGGED_IN, count: 50 },
        { eventType: MetricEventType.USER_SIGNED_UP, count: 20 },
      ];

      mockMetricsService.getEventTypeDistribution.mockResolvedValue(
        mockDistribution,
      );

      const result = await controller.getEventTypeDistribution();

      expect(result).toEqual(mockDistribution);
      expect(
        mockMetricsService.getEventTypeDistribution,
      ).toHaveBeenCalledWith();
    });
  });
});
