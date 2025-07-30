import { Test, TestingModule } from '@nestjs/testing';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendStatus } from './dto/friend.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';

describe('FriendsController', () => {
  let controller: FriendsController;

  const mockFriendsService = {
    addFriend: jest.fn(),
    updateFriendRequest: jest.fn(),
    getFriends: jest.fn(),
    getPendingRequests: jest.fn(),
    removeFriend: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [
        {
          provide: FriendsService,
          useValue: mockFriendsService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<FriendsController>(FriendsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFriend', () => {
    it('should add a friend', async () => {
      const userId = 'user1';
      const addFriendDto = { friendId: 'user2' };
      const expectedResult = {
        id: 'friendship1',
        user_id: userId,
        friend_id: 'user2',
        status: FriendStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
        friend: {
          id: 'user2',
          fullName: 'Friend User',
          nickname: null,
          avatarUrl: null,
          rating: null,
        },
      };

      mockFriendsService.addFriend.mockResolvedValue(expectedResult);

      const result = await controller.addFriend(userId, addFriendDto);

      expect(mockFriendsService.addFriend).toHaveBeenCalledWith(
        userId,
        addFriendDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateFriendRequest', () => {
    it('should update friend request', async () => {
      const userId = 'user1';
      const requestId = 'request1';
      const updateDto = { status: FriendStatus.ACCEPTED };
      const expectedResult = {
        id: requestId,
        user_id: 'user2',
        friend_id: userId,
        status: FriendStatus.ACCEPTED,
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: 'user2',
          fullName: 'Sender User',
          nickname: null,
          avatarUrl: null,
          rating: null,
        },
      };

      mockFriendsService.updateFriendRequest.mockResolvedValue(expectedResult);

      const result = await controller.updateFriendRequest(
        userId,
        requestId,
        updateDto,
      );

      expect(mockFriendsService.updateFriendRequest).toHaveBeenCalledWith(
        userId,
        requestId,
        updateDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getFriends', () => {
    it('should get friends list', async () => {
      const userId = 'user1';
      const expectedResult = {
        friends: [
          {
            id: 'friendship1',
            user_id: userId,
            friend_id: 'user2',
            status: FriendStatus.ACCEPTED,
            created_at: new Date(),
            updated_at: new Date(),
            friend: {
              id: 'user2',
              fullName: 'Friend User',
              nickname: null,
              avatarUrl: null,
              rating: null,
            },
          },
        ],
        total: 1,
      };

      mockFriendsService.getFriends.mockResolvedValue(expectedResult);

      const result = await controller.getFriends(userId);

      expect(mockFriendsService.getFriends).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getPendingRequests', () => {
    it('should get pending requests', async () => {
      const userId = 'user1';
      const expectedResult = {
        sentRequests: [],
        receivedRequests: [
          {
            id: 'request1',
            user_id: 'user2',
            friend_id: userId,
            status: FriendStatus.PENDING,
            created_at: new Date(),
            updated_at: new Date(),
            user: {
              id: 'user2',
              fullName: 'Sender User',
              nickname: null,
              avatarUrl: null,
              rating: null,
            },
          },
        ],
        totalSent: 0,
        totalReceived: 1,
      };

      mockFriendsService.getPendingRequests.mockResolvedValue(expectedResult);

      const result = await controller.getPendingRequests(userId);

      expect(mockFriendsService.getPendingRequests).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('removeFriend', () => {
    it('should remove friend', async () => {
      const userId = 'user1';
      const friendshipId = 'friendship1';

      mockFriendsService.removeFriend.mockResolvedValue(undefined);

      await controller.removeFriend(userId, friendshipId);

      expect(mockFriendsService.removeFriend).toHaveBeenCalledWith(
        userId,
        friendshipId,
      );
    });
  });
});
