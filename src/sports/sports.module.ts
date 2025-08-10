import { Module } from '@nestjs/common';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [SportsController],
  providers: [SportsService, PrismaService],
  exports: [SportsService],
})
export class SportsModule {}
