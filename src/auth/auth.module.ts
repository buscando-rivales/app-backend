import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../services/prisma.service';
import { ClerkAuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  providers: [ClerkService, PrismaService, ClerkAuthGuard],
  exports: [ClerkService, ClerkAuthGuard],
})
export class AuthModule {}
