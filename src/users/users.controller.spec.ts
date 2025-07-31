/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { SearchUsersDto } from './dto/user-search.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

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

  const mockUsersService = {
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    searchUsersByNickname: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['jugador'],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(usersService.findUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      const result = await controller.getProfile(mockRequest);

      expect(usersService.findUserById).toHaveBeenCalledWith('user-1');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'Updated User',
        phone: '987654321',
        nickname: 'updateduser',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile('user-1', updateUserDto);

      expect(usersService.updateUser).toHaveBeenCalledWith(
        'user-1',
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should handle partial updates', async () => {
      const updateUserDto: UpdateUserDto = {
        nickname: 'newnickname',
      };

      const updatedUser = { ...mockUser, nickname: 'newnickname' };
      mockUsersService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile('user-1', updateUserDto);

      expect(usersService.updateUser).toHaveBeenCalledWith(
        'user-1',
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('searchUsers', () => {
    it('should search users by nickname successfully', async () => {
      const searchDto: SearchUsersDto = {
        query: 'test',
        limit: 10,
      };

      const mockSearchResponse = {
        users: [
          {
            id: 'user-1',
            fullName: 'Test User 1',
            nickname: 'testuser1',
            avatarUrl: 'https://example.com/avatar1.jpg',
            rating: 4.5,
          },
          {
            id: 'user-2',
            fullName: 'Test User 2',
            nickname: 'testuser2',
            avatarUrl: null,
            rating: null,
          },
        ],
        total: 2,
        query: 'test',
      };

      mockUsersService.searchUsersByNickname.mockResolvedValue(
        mockSearchResponse,
      );

      const result = await controller.searchUsers(searchDto);

      expect(usersService.searchUsersByNickname).toHaveBeenCalledWith(
        searchDto,
      );
      expect(result).toEqual(mockSearchResponse);
    });

    it('should handle empty search results', async () => {
      const searchDto: SearchUsersDto = {
        query: 'nonexistent',
      };

      const mockSearchResponse = {
        users: [],
        total: 0,
        query: 'nonexistent',
      };

      mockUsersService.searchUsersByNickname.mockResolvedValue(
        mockSearchResponse,
      );

      const result = await controller.searchUsers(searchDto);

      expect(result).toEqual(mockSearchResponse);
    });
  });
});
