import { Test, TestingModule } from '@nestjs/testing';
import { FieldsService } from './fields.service';
import { PrismaService } from '../services/prisma.service'; // Importar PrismaService

describe('FieldsService', () => {
  let fieldsService: FieldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldsService,
        {
          provide: PrismaService,
          useValue: {
            // Mock de PrismaService
            field: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    fieldsService = module.get<FieldsService>(FieldsService);
  });

  it('debería estar definido', () => {
    expect(fieldsService).toBeDefined();
  });

  describe('findAll', () => {
    it('debería devolver una lista de campos', async () => {
      jest.spyOn(fieldsService, 'findAll').mockImplementation(() =>
        Promise.resolve({
          data: [
            {
              id: '1',
              name: 'Field 1',
              address: 'Address 1',
              openingTime: '08:00',
              closingTime: '22:00',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      );
      const result = await fieldsService.findAll({});
      expect(result).toEqual({
        data: [
          {
            id: '1',
            name: 'Field 1',
            address: 'Address 1',
            openingTime: '08:00',
            closingTime: '22:00',
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
    it('debería devolver un campo por ID', async () => {
      const id = '1';
      jest.spyOn(fieldsService, 'findOne').mockImplementation((id: string) =>
        Promise.resolve({
          id,
          name: `Field ${id}`,
          address: 'Address 1',
          openingTime: '08:00',
          closingTime: '22:00',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );
      const result = await fieldsService.findOne(id);
      expect(result).toEqual({
        id,
        name: `Field ${id}`,
        address: 'Address 1',
        openingTime: '08:00',
        closingTime: '22:00',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
