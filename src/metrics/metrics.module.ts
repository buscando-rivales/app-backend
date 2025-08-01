import { Module, forwardRef } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { PrismaService } from '../services/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [MetricsController],
  providers: [MetricsService, PrismaService],
  exports: [MetricsService],
})
export class MetricsModule {}
