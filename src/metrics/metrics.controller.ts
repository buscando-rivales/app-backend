import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { GetMetricsDto, MetricEventType } from './dto/metric.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';

@Controller('metrics')
@UseGuards(ClerkAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(
    @Query(new ValidationPipe({ transform: true })) query: GetMetricsDto,
  ) {
    return this.metricsService.getMetrics(query);
  }

  @Get('summary')
  async getMetricsSummary(@Query('eventType') eventType?: MetricEventType) {
    return this.metricsService.getMetricsSummary(eventType);
  }

  @Get('distribution')
  async getEventTypeDistribution() {
    return this.metricsService.getEventTypeDistribution();
  }
}
