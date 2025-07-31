import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { FieldsModule } from './fields/fields.module';
import { PrismaService } from './services/prisma.service';
import configuration from './config/configuration';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { GamesModule } from './games/games.module';
import { FriendsModule } from './friends/friends.module';
import { NotificationModule } from './notifications/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    FieldsModule,
    GamesModule,
    FriendsModule,
    NotificationModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
