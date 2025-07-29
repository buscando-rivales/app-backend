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
        f.name AS field_name,
        ST_Distance(f.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
        g.id AS game_id,
        g.start_time,
        g.available_spots,
        g.price_per_player,
        u.full_name AS organizer_name,
        g.game_level,
        g.game_type
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
      ORDER BY f.name ASC, distance_meters ASC, g.start_time ASC;
    `;

    const results: Array<{
      field_name: string;
      distance_meters: number;
      game_id: string;
      start_time: string;
      available_spots: number;
      price_per_player: string;
      organizer_name: string;
      game_level: number;
      game_type: number;
    }> = await this.prisma.$queryRawUnsafe(query, longitude, latitude, radius);

    // Agrupar los resultados por field_name
    const groupedResults = results.reduce<
      Array<{
        field_name: string;
        distance_meters: number;
        games: Array<{
          game_id: string;
          start_time: string;
          available_spots: number;
          price_per_player: string;
          organizer_name: string;
          game_level: number;
          game_type: number;
        }>;
      }>
    >((acc, curr) => {
      const field = acc.find((f) => f.field_name === curr.field_name);
      if (field) {
        field.games.push({
          game_id: curr.game_id,
          start_time: curr.start_time,
          available_spots: curr.available_spots,
          price_per_player: curr.price_per_player,
          organizer_name: curr.organizer_name,
          game_level: curr.game_level,
          game_type: curr.game_type,
        });
      } else {
        acc.push({
          field_name: curr.field_name,
          distance_meters: curr.distance_meters,
          games: [
            {
              game_id: curr.game_id,
              start_time: curr.start_time,
              available_spots: curr.available_spots,
              price_per_player: curr.price_per_player,
              organizer_name: curr.organizer_name,
              game_level: curr.game_level,
              game_type: curr.game_type,
            },
          ],
        });
      }
      return acc;
    }, []);

    return groupedResults;
  }
}
