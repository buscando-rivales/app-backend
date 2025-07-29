import { Test, TestingModule } from '@nestjs/testing';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { ClerkService } from '../auth/clerk.service';

describe('GamesController', () => {
  let gamesController: GamesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: {
            findAll: jest.fn(() =>
              Promise.resolve([{ id: '1', name: 'Game 1' }]),
            ),
            findOne: jest.fn((id: string) =>
              Promise.resolve({ id, name: `Game ${id}` }),
            ),
            findNearby: jest.fn(),
          },
        },
        {
          provide: ClerkService,
          useValue: {
            validateToken: jest.fn(() => Promise.resolve(true)),
          },
        },
      ],
    }).compile();

    gamesController = module.get<GamesController>(GamesController);
  });

  it('debería estar definido', () => {
    expect(gamesController).toBeDefined();
  });

  describe('findAll', () => {
    it('debería devolver una lista de juegos', async () => {
      const result = await gamesController.findAll();
      expect(result).toEqual([{ id: '1', name: 'Game 1' }]);
    });
  });

  describe('findOne', () => {
    it('debería devolver un juego por ID', async () => {
      const id = '1';
      const result = await gamesController.findOne(id);
      expect(result).toEqual({ id, name: `Game ${id}` });
    });
  });

  describe('findNearby', () => {
    it('debería devolver una lista de juegos cercanos', async () => {
      const mockGames = [
        {
          game_id: '1',
          field_name: 'Field A',
          distance_meters: 500,
          start_time: new Date(),
          available_spots: 5,
          price_per_player: 100,
        },
      ];

      jest
        .spyOn(gamesController['gamesService'], 'findNearby')
        .mockResolvedValue(mockGames);

      const result = await gamesController.findNearby(40.7128, -74.006, 1000);
      expect(result).toEqual(mockGames);
    });
  });
});
