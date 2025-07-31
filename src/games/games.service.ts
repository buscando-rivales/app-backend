import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';
import { GamePlayersResponseDto } from './dto/game-player.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

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

  // Métodos para manejar jugadores en juegos

  async joinGame(gameId: string, playerId: string) {
    // Verificar que el juego existe y tiene espacios disponibles
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        gamePlayers: {
          where: { status: 'joined' },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Juego no encontrado');
    }

    if (game.status !== 'open') {
      throw new BadRequestException(
        'El juego no está abierto para nuevos jugadores',
      );
    }

    if (game.availableSpots <= 0) {
      throw new BadRequestException(
        'No hay espacios disponibles en este juego',
      );
    }

    // Verificar que el jugador no esté ya en el juego
    const existingPlayer = await this.prisma.gamePlayer.findUnique({
      where: {
        gameId_playerId: {
          gameId,
          playerId,
        },
      },
    });

    if (existingPlayer) {
      if (existingPlayer.status === 'joined') {
        throw new ConflictException('Ya estás unido a este juego');
      }
      // Si ya existe pero con otro status, actualizamos a 'joined'
      const updatedPlayer = await this.prisma.gamePlayer.update({
        where: { id: existingPlayer.id },
        data: { status: 'joined', joinedAt: new Date() },
        include: {
          player: {
            select: {
              id: true,
              fullName: true,
              nickname: true,
              avatarUrl: true,
              rating: true,
            },
          },
        },
      });

      // Enviar notificación al organizador del juego
      try {
        await this.notificationService.notifyGameJoin(
          game.organizerId,
          updatedPlayer.player.nickname || updatedPlayer.player.fullName,
          {
            gameId: game.id,
            gameType: game.gameType,
            startTime: game.startTime,
          },
        );
      } catch (error) {
        // No fallar el join si la notificación falla
        console.error('Error enviando notificación de join:', error);
      }

      return updatedPlayer;
    }

    // Crear nuevo registro de jugador
    const newPlayer = await this.prisma.gamePlayer.create({
      data: {
        gameId,
        playerId,
        status: 'joined',
      },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    // Actualizar espacios disponibles
    await this.prisma.game.update({
      where: { id: gameId },
      data: { availableSpots: { decrement: 1 } },
    });

    // Enviar notificación al organizador del juego
    try {
      await this.notificationService.notifyGameJoin(
        game.organizerId,
        newPlayer.player.nickname || newPlayer.player.fullName,
        {
          gameId: game.id,
          gameType: game.gameType,
          startTime: game.startTime,
        },
      );
    } catch (error) {
      // No fallar el join si la notificación falla
      console.error('Error enviando notificación de join:', error);
    }

    return newPlayer;
  }

  async leaveGame(gameId: string, playerId: string) {
    // Verificar que el jugador está en el juego
    const gamePlayer = await this.prisma.gamePlayer.findUnique({
      where: {
        gameId_playerId: {
          gameId,
          playerId,
        },
      },
    });

    if (!gamePlayer) {
      throw new NotFoundException('No estás unido a este juego');
    }

    if (gamePlayer.status !== 'joined') {
      throw new BadRequestException('No estás actualmente unido a este juego');
    }

    // Actualizar status a 'left'
    const updatedPlayer = await this.prisma.gamePlayer.update({
      where: { id: gamePlayer.id },
      data: { status: 'left' },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    // Actualizar espacios disponibles
    await this.prisma.game.update({
      where: { id: gameId },
      data: { availableSpots: { increment: 1 } },
    });

    return updatedPlayer;
  }

  async getGamePlayers(gameId: string): Promise<GamePlayersResponseDto> {
    // Verificar que el juego existe
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        totalSpots: true,
        availableSpots: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Juego no encontrado');
    }

    // Obtener todos los jugadores del juego
    const players = await this.prisma.gamePlayer.findMany({
      where: {
        gameId,
        status: 'joined', // Solo jugadores activos
      },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    const formattedPlayers = players.map((gamePlayer) => ({
      id: gamePlayer.id,
      gameId: gamePlayer.gameId,
      playerId: gamePlayer.playerId,
      joinedAt: gamePlayer.joinedAt,
      status: gamePlayer.status,
      player: {
        id: gamePlayer.player.id,
        fullName: gamePlayer.player.fullName,
        nickname: gamePlayer.player.nickname,
        avatarUrl: gamePlayer.player.avatarUrl,
        rating: gamePlayer.player.rating
          ? Number(gamePlayer.player.rating)
          : null,
      },
    }));

    return {
      players: formattedPlayers,
      totalPlayers: players.length,
      availableSpots: game.availableSpots,
      totalSpots: game.totalSpots,
    };
  }

  async kickPlayer(gameId: string, playerId: string, organizerId: string) {
    // Verificar que el juego existe y que el usuario es el organizador
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { organizerId: true },
    });

    if (!game) {
      throw new NotFoundException('Juego no encontrado');
    }

    if (game.organizerId !== organizerId) {
      throw new BadRequestException(
        'Solo el organizador puede expulsar jugadores',
      );
    }

    // Verificar que el jugador está en el juego
    const gamePlayer = await this.prisma.gamePlayer.findUnique({
      where: {
        gameId_playerId: {
          gameId,
          playerId,
        },
      },
    });

    if (!gamePlayer) {
      throw new NotFoundException('El jugador no está en este juego');
    }

    if (gamePlayer.status !== 'joined') {
      throw new BadRequestException(
        'El jugador no está actualmente unido a este juego',
      );
    }

    // Actualizar status a 'kicked'
    const updatedPlayer = await this.prisma.gamePlayer.update({
      where: { id: gamePlayer.id },
      data: { status: 'kicked' },
      include: {
        player: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            rating: true,
          },
        },
      },
    });

    // Actualizar espacios disponibles
    await this.prisma.game.update({
      where: { id: gameId },
      data: { availableSpots: { increment: 1 } },
    });

    return updatedPlayer;
  }
}
