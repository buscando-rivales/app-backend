import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import {
  GetMetricsDto,
  MetricEventType,
  UserLoginMetric,
  UserSignUpMetric,
  UserUpdatedProfileMetric,
  SearchNearbyGamesMetric,
  UserSentFriendRequestMetric,
  UserAcceptedFriendRequestMetric,
  UserRejectedFriendRequestMetric,
  NotificationSentMetric,
  ChatMessageSentMetric,
} from './dto/metric.dto';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private prisma: PrismaService) {}

  async logMetric(
    eventType: MetricEventType,
    eventData: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.metric.create({
        data: {
          eventType,
          eventData,
        },
      });

      this.logger.debug(`Metric logged: ${eventType}`, eventData);
    } catch (error) {
      this.logger.error(`Failed to log metric: ${eventType}`, error);
      // No lanzamos error para que no afecte el flujo principal
    }
  }

  async logUserLogin(data: UserLoginMetric): Promise<void> {
    await this.logMetric(MetricEventType.USER_LOGGED_IN, data);
  }

  async logUserSignUp(data: UserSignUpMetric): Promise<void> {
    await this.logMetric(MetricEventType.USER_SIGNED_UP, data);
  }

  async logUserUpdatedProfile(data: UserUpdatedProfileMetric): Promise<void> {
    await this.logMetric(MetricEventType.USER_UPDATED_PROFILE, data);
  }

  async logSearchNearbyGames(data: SearchNearbyGamesMetric): Promise<void> {
    await this.logMetric(MetricEventType.SEARCH_NEARBY_GAMES, data);
  }

  async logUserSentFriendRequest(
    data: UserSentFriendRequestMetric,
  ): Promise<void> {
    await this.logMetric(MetricEventType.USER_SENT_FRIEND_REQUEST, data);
  }

  async logUserAcceptedFriendRequest(
    data: UserAcceptedFriendRequestMetric,
  ): Promise<void> {
    await this.logMetric(MetricEventType.USER_ACCEPTED_FRIEND_REQUEST, data);
  }

  async logUserRejectedFriendRequest(
    data: UserRejectedFriendRequestMetric,
  ): Promise<void> {
    await this.logMetric(MetricEventType.USER_REJECTED_FRIEND_REQUEST, data);
  }

  async logNotificationSent(data: NotificationSentMetric): Promise<void> {
    await this.logMetric(MetricEventType.NOTIFICATION_SENT, data);
  }

  async logChatMessageSent(data: ChatMessageSentMetric): Promise<void> {
    await this.logMetric(MetricEventType.CHAT_MESSAGE_SENT, data);
  }

  async getMetrics(query: GetMetricsDto) {
    const {
      eventType,
      userId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = query;

    const where: any = {};

    if (eventType) {
      where.eventType = eventType;
    }

    if (userId) {
      where.eventData = {
        path: ['userId'],
        equals: userId,
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [metrics, total] = await Promise.all([
      this.prisma.metric.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.metric.count({ where }),
    ]);

    return {
      metrics,
      total,
      limit,
      offset,
    };
  }

  async getMetricsSummary(eventType?: MetricEventType) {
    const where = eventType ? { eventType } : {};

    const [totalMetrics, metricsToday, metricsThisWeek, metricsThisMonth] =
      await Promise.all([
        this.prisma.metric.count({ where }),
        this.prisma.metric.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.prisma.metric.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        this.prisma.metric.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    return {
      total: totalMetrics,
      today: metricsToday,
      thisWeek: metricsThisWeek,
      thisMonth: metricsThisMonth,
    };
  }

  async getEventTypeDistribution() {
    const metrics = await this.prisma.metric.groupBy({
      by: ['eventType'],
      _count: {
        eventType: true,
      },
      orderBy: {
        _count: {
          eventType: 'desc',
        },
      },
    });

    return metrics.map((metric) => ({
      eventType: metric.eventType,
      count: metric._count.eventType,
    }));
  }
}
