import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { PrismaService } from 'src/services/prisma.service';
import { ClerkService } from 'src/auth/clerk.service';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, PrismaService, ClerkService],
  exports: [DevicesService],
})
export class DevicesModule {}
