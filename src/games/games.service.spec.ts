import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { PrismaService } from '../services/prisma.service';

describe('GamesService', () => {
  let gamesService: GamesService;

  const mockPrismaService = {
    game: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    gamePlayer: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    gamesService = module.get<GamesService>(GamesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(gamesService).toBeDefined();
  });

  describe('findAll', () => {
    it('debería devolver una lista de juegos', async () => {
      mockPrismaService.game.findMany.mockResolvedValue([
        { id: '1', name: 'Game 1' },
        { id: '2', name: 'Game 2' },
      ]);

      const result = await gamesService.findAll();
      expect(result).toEqual([
        { id: '1', name: 'Game 1' },
        { id: '2', name: 'Game 2' },
      ]);
    });
  });

  describe('findOne', () => {
    it('debería devolver un juego por ID', async () => {
      const id = '1';
      mockPrismaService.game.findUnique.mockResolvedValue({
        id,
        name: `Game ${id}`,
      });

      const result = await gamesService.findOne(id);
      expect(result).toEqual({ id, name: `Game ${id}` });
    });
  });

  describe('findNearby', () => {
    it('should return nearby games grouped by field', async () => {
      const mockQueryResult = [
        {
          field_name: 'Field A',
          distance_meters: 500,
          games: [
            {
              game_id: '1',
              start_time: '2025-08-01T18:00:00.000Z',
              available_spots: 5,
              price_per_player: '100',
              organizer_name: 'John Doe',
              game_level: 1,
              game_type: 5,
            },
          ],
        },
      ];

      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        {
          field_name: 'Field A',
          distance_meters: 500,
          game_id: '1',
          start_time: '2025-08-01T18:00:00.000Z',
          available_spots: 5,
          price_per_player: '100',
          organizer_name: 'John Doe',
          game_level: 1,
          game_type: 5,
        },
      ]);

      const result = await gamesService.findNearby(40.7128, -74.006, 1000);
      expect(result).toEqual(mockQueryResult);
    });
  });

  describe('joinGame', () => {
    it('should successfully join a game', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      const mockGame = {
        id: gameId,
        status: 'open',
        availableSpots: 3,
        gamePlayers: [],
      };

      const mockNewPlayer = {
        id: 'gameplayer-1',
        gameId,
        playerId,
        status: 'joined',
        joinedAt: new Date(),
        player: {
          id: playerId,
          fullName: 'Test Player',
          nickname: 'testplayer',
          avatarUrl: null,
          rating: 4.5,
        },
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.gamePlayer.findUnique.mockResolvedValue(null);
      mockPrismaService.gamePlayer.create.mockResolvedValue(mockNewPlayer);
      mockPrismaService.game.update.mockResolvedValue(mockGame);

      const result = await gamesService.joinGame(gameId, playerId);

      expect(mockPrismaService.game.findUnique).toHaveBeenCalledWith({
        where: { id: gameId },
        include: {
          gamePlayers: {
            where: { status: 'joined' },
          },
        },
      });
      expect(mockPrismaService.gamePlayer.create).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockNewPlayer);
    });

    it('should throw NotFoundException if game does not exist', async () => {
      const gameId = 'nonexistent-game';
      const playerId = 'player-1';

      mockPrismaService.game.findUnique.mockResolvedValue(null);

      await expect(gamesService.joinGame(gameId, playerId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if game is not open', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      const mockGame = {
        id: gameId,
        status: 'closed',
        availableSpots: 3,
        gamePlayers: [],
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);

      await expect(gamesService.joinGame(gameId, playerId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no available spots', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      const mockGame = {
        id: gameId,
        status: 'open',
        availableSpots: 0,
        gamePlayers: [],
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);

      await expect(gamesService.joinGame(gameId, playerId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if player already joined', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      const mockGame = {
        id: gameId,
        status: 'open',
        availableSpots: 3,
        gamePlayers: [],
      };

      const mockExistingPlayer = {
        id: 'gameplayer-1',
        gameId,
        playerId,
        status: 'joined',
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.gamePlayer.findUnique.mockResolvedValue(
        mockExistingPlayer,
      );

      await expect(gamesService.joinGame(gameId, playerId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('leaveGame', () => {
    it('should successfully leave a game', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      const mockGamePlayer = {
        id: 'gameplayer-1',
        gameId,
        playerId,
        status: 'joined',
      };

      const mockUpdatedPlayer = {
        ...mockGamePlayer,
        status: 'left',
        player: {
          id: playerId,
          fullName: 'Test Player',
          nickname: 'testplayer',
          avatarUrl: null,
          rating: 4.5,
        },
      };

      mockPrismaService.gamePlayer.findUnique.mockResolvedValue(mockGamePlayer);
      mockPrismaService.gamePlayer.update.mockResolvedValue(mockUpdatedPlayer);
      mockPrismaService.game.update.mockResolvedValue({});

      const result = await gamesService.leaveGame(gameId, playerId);

      expect(mockPrismaService.gamePlayer.update).toHaveBeenCalledWith({
        where: { id: mockGamePlayer.id },
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
      expect(result).toEqual(mockUpdatedPlayer);
    });

    it('should throw NotFoundException if player not in game', async () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      mockPrismaService.gamePlayer.findUnique.mockResolvedValue(null);

      await expect(gamesService.leaveGame(gameId, playerId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGamePlayers', () => {
    it('should return game players successfully', async () => {
      const gameId = 'game-1';

      const mockGame = {
        id: gameId,
        totalSpots: 10,
        availableSpots: 2,
      };

      const mockPlayers = [
        {
          id: 'gameplayer-1',
          gameId,
          playerId: 'player-1',
          status: 'joined',
          joinedAt: new Date(),
          player: {
            id: 'player-1',
            fullName: 'Player 1',
            nickname: 'player1',
            avatarUrl: null,
            rating: 4.5,
          },
        },
      ];

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.gamePlayer.findMany.mockResolvedValue(mockPlayers);

      const result = await gamesService.getGamePlayers(gameId);

      expect(result.players).toHaveLength(1);
      expect(result.totalPlayers).toBe(1);
      expect(result.availableSpots).toBe(2);
      expect(result.totalSpots).toBe(10);
    });

    it('should throw NotFoundException if game does not exist', async () => {
      const gameId = 'nonexistent-game';

      mockPrismaService.game.findUnique.mockResolvedValue(null);

      await expect(gamesService.getGamePlayers(gameId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
