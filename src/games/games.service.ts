import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateGameDto & { organizerId: string }) {
    return this.prisma.game.create({ data });
  }

  findAll() {
    return this.prisma.game.findMany();
  }

  findOne(id: string) {
    return this.prisma.game.findUnique({ where: { id } });
  }

  update(id: string, data: UpdateGameDto) {
    return this.prisma.game.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.game.delete({ where: { id } });
  }
}
