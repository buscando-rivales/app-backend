/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../services/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    phone: '123456789',
    avatarUrl: 'https://example.com/avatar.jpg',
    rating: 4.5,
    nickname: 'testuser',
    roles: ['jugador'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateUser', () => {
    it('should create or update a user', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockPrismaService.user.upsert.mockResolvedValue(mockUser);

      const result = await service.createOrUpdateUser(userData);

      expect(prismaService.user.upsert).toHaveBeenCalledWith({
        where: { id: userData.id },
        update: {
          email: userData.email,
          fullName: `${userData.firstName} ${userData.lastName}`,
        },
        create: {
          id: userData.id,
          email: userData.email,
          fullName: `${userData.firstName} ${userData.lastName}`,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '123456789',
        avatarUrl: 'https://example.com/avatar.jpg',
        rating: 5.0,
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser(createUserDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserById', () => {
    it('should find a user by id', async () => {
      const userId = 'user-1';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserById(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const userId = 'non-existent-user';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findUserById(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByNickname', () => {
    it('should find a user by nickname', async () => {
      const nickname = 'testuser';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByNickname(nickname);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { nickname },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user with nickname not found', async () => {
      const nickname = 'non-existent-nickname';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByNickname(nickname);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { nickname },
      });
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const userId = 'user-1';
      const updateUserDto: UpdateUserDto = {
        fullName: 'Updated User',
        phone: '987654321',
        nickname: 'updateduser',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUser(userId, updateUserDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateUserRating', () => {
    it('should update user rating', async () => {
      const userId = 'user-1';
      const newRating = 4.8;

      const updatedUser = { ...mockUser, rating: newRating };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserRating(userId, newRating);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { rating: newRating },
      });
      expect(result).toEqual(updatedUser);
    });
  });
});
