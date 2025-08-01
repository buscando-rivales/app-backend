import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../services/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [AuthModule, MetricsModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}
