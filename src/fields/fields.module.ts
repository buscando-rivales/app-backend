import { Module } from '@nestjs/common';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { PrismaService } from '../services/prisma.service';

@Module({
  controllers: [FieldsController],
  providers: [FieldsService, PrismaService],
  exports: [FieldsService],
})
export class FieldsModule {}
