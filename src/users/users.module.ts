import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../services/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MetricsModule } from '../metrics/metrics.module';
import { UniqueNicknameValidator } from './validators/unique-nickname.validator';
import { PositionExistsValidator } from './validators/position-exists.validator';
import { DateService } from '../utils/date.service';

@Module({
  imports: [AuthModule, MetricsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    UniqueNicknameValidator,
    PositionExistsValidator,
    DateService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
