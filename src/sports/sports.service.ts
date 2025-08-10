import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { SportDto, PositionDto, SportWithPositionsDto } from './dto/sport.dto';

@Injectable()
export class SportsService {
  constructor(private prisma: PrismaService) {}

  async findAllSports(): Promise<SportDto[]> {
    const sports = await this.prisma.sports.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return sports.map((sport) => ({
      id: sport.id,
      code: sport.code,
      name: sport.name,
      is_active: sport.is_active,
      created_at: sport.created_at,
    }));
  }

  async findPositionsBySport(
    sportId: string,
    type?: string,
  ): Promise<PositionDto[]> {
    const whereClause: any = {
      sport_id: sportId,
    };

    if (type) {
      whereClause.type = type;
    }

    const positions = await this.prisma.positions.findMany({
      where: whereClause,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return positions.map((position) => ({
      id: position.id,
      name: position.name,
      type: position.type,
      sport_id: position.sport_id,
    }));
  }

  async findSportsWithPositions(): Promise<SportWithPositionsDto[]> {
    const sports = await this.prisma.sports.findMany({
      where: {
        is_active: true,
      },
      include: {
        positions: {
          orderBy: [{ type: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return sports.map((sport) => ({
      id: sport.id,
      code: sport.code,
      name: sport.name,
      is_active: sport.is_active,
      created_at: sport.created_at,
      positions: sport.positions.map((position) => ({
        id: position.id,
        name: position.name,
        type: position.type,
        sport_id: position.sport_id,
      })),
    }));
  }
}
