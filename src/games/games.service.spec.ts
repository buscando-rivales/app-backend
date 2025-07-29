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
            // Mock de PrismaService
            game: {
              findMany: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: '1',
                      name: 'Game 1',
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  ],
                  total: 1,
                  hasNextPage: false,
                  hasPreviousPage: false,
                  limit: 10,
                  page: 1,
                  totalPages: 1,
                }),
              ),
              findUnique: jest.fn(({ where: { id } }) =>
                Promise.resolve({
                  id,
                  name: `Game ${id}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              ),
            },
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
      expect(result).toEqual({
        data: [
          {
            id: '1',
            name: 'Game 1',
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('findOne', () => {
    it('debería devolver un juego por ID', async () => {
      const id = '1';
      const result = await gamesService.findOne(id);
      expect(result).toEqual({
        id,
        name: `Game ${id}`,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
