import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { PrismaService } from '../services/prisma.service';

describe('GamesService', () => {
  let gamesService: GamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: PrismaService,
          useValue: {
            game: {
              findMany: jest.fn(() =>
                Promise.resolve([
                  { id: '1', name: 'Game 1' },
                  { id: '2', name: 'Game 2' },
                ]),
              ),
              findUnique: jest.fn(({ where: { id } }) =>
                Promise.resolve({ id, name: `Game ${id}` }),
              ),
            },
            $queryRawUnsafe: jest.fn(() =>
              Promise.resolve([
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
              ]),
            ),
          },
        },
      ],
    }).compile();

    gamesService = module.get<GamesService>(GamesService);
  });

  it('debería estar definido', () => {
    expect(gamesService).toBeDefined();
  });

  describe('findAll', () => {
    it('debería devolver una lista de juegos', async () => {
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
      const result = await gamesService.findOne(id);
      expect(result).toEqual({ id, name: `Game ${id}` });
    });
  });

  describe('findNearby', () => {
    it('debería devolver una lista de juegos cercanos agrupados por cancha', async () => {
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

      const result = await gamesService.findNearby(40.7128, -74.006, 1000);
      expect(result).toEqual(mockQueryResult);
    });
  });
});
