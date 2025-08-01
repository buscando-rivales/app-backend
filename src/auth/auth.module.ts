import { Module, forwardRef } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../services/prisma.service';
import { ClerkAuthGuard } from './auth.guard';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [forwardRef(() => MetricsModule)],
  controllers: [AuthController],
  providers: [ClerkService, PrismaService, ClerkAuthGuard],
  exports: [ClerkService, ClerkAuthGuard],
})
export class AuthModule {}
