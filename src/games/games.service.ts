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

  async findNearby(latitude: number, longitude: number, radius: number) {
    const query = `
      SELECT 
        g.id AS game_id,
        f.name AS field_name,
        ST_Distance(f.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
        g.start_time,
        g.available_spots,
        g.price_per_player,
        u.full_name AS organizer_name,
        game_level,
        game_type
      FROM public.games g
      JOIN public.fields f ON g.field_id = f.id
      JOIN public.users u ON g.organizer_id = u.id
      WHERE g.status = 'open'
        AND g.start_time > now()
        AND ST_DWithin(
              f.location,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              $3 * 1000
            )
      ORDER BY distance_meters ASC, g.start_time ASC;
    `;

    return this.prisma.$queryRawUnsafe(query, longitude, latitude, radius);
  }
}
