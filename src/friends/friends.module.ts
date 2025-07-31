import { Module, forwardRef } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { PrismaService } from '../services/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [AuthModule, forwardRef(() => NotificationModule)],
  controllers: [FriendsController],
  providers: [FriendsService, PrismaService],
  exports: [FriendsService],
})
export class FriendsModule {}
