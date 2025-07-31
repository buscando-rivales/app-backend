import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaService } from '../services/prisma.service';
import { ClerkService } from '../auth/clerk.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    PrismaService,
    ClerkService,
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
