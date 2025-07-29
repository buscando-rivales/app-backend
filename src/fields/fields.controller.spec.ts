import { Test, TestingModule } from '@nestjs/testing';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';

describe('FieldsController', () => {
  let fieldsController: FieldsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldsController],
      providers: [
        {
          provide: FieldsService,
          useValue: {
            findAll: jest.fn(() =>
              Promise.resolve([{ id: '1', name: 'Field 1' }]),
            ),
            findOne: jest.fn((id: string) =>
              Promise.resolve({ id, name: `Field ${id}` }),
            ),
          },
        },
      ],
    }).compile();

    fieldsController = module.get<FieldsController>(FieldsController);
  });

  it('debería estar definido', () => {
    expect(fieldsController).toBeDefined();
  });

  describe('findAll', () => {
    it('debería devolver una lista de campos', async () => {
      const result = await fieldsController.findAll({});
      expect(result).toEqual([{ id: '1', name: 'Field 1' }]);
    });
  });

  describe('findOne', () => {
    it('debería devolver un campo por ID', async () => {
      const id = '1';
      const result = await fieldsController.findOne(id);
      expect(result).toEqual({ id, name: `Field ${id}` });
    });
  });
});
