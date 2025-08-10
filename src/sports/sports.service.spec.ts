import { Test, TestingModule } from '@nestjs/testing';
import { SportsService } from './sports.service';
import { PrismaService } from '../services/prisma.service';

describe('SportsService', () => {
  let service: SportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SportsService,
        {
          provide: PrismaService,
          useValue: {
            sports: {
              findMany: jest.fn(),
            },
            positions: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SportsService>(SportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
