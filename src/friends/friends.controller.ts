import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import {
  AddFriendDto,
  UpdateFriendRequestDto,
  FriendResponseDto,
  FriendListResponseDto,
  PendingRequestsResponseDto,
} from './dto/friend.dto';

@ApiTags('Friends')
@ApiBearerAuth()
@Controller('friends')
@UseGuards(ClerkAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @ApiOperation({
    summary: 'Send a friend request',
    description:
      'Send a friend request to another user. The request will be in pending status until the recipient responds.',
  })
  @ApiBody({
    type: AddFriendDto,
    description: 'Information about the user to add as a friend',
  })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
    type: FriendResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot add yourself as a friend',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Friendship already exists',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addFriend(
    @CurrentUser() userId: string,
    @Body() addFriendDto: AddFriendDto,
  ): Promise<FriendResponseDto> {
    return this.friendsService.addFriend(userId, addFriendDto);
  }

  @ApiOperation({
    summary: 'Respond to a friend request',
    description:
      'Accept, reject, or block a friend request. Only the recipient of the request can perform this action.',
  })
  @ApiParam({
    name: 'requestId',
    description: 'The ID of the friend request to update',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiBody({
    type: UpdateFriendRequestDto,
    description: 'New status for the friend request',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request updated successfully',
    type: FriendResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found or insufficient permissions',
  })
  @Patch(':requestId')
  async updateFriendRequest(
    @CurrentUser() userId: string,
    @Param('requestId') requestId: string,
    @Body() updateFriendRequestDto: UpdateFriendRequestDto,
  ): Promise<FriendResponseDto> {
    return this.friendsService.updateFriendRequest(
      userId,
      requestId,
      updateFriendRequestDto,
    );
  }

  @ApiOperation({
    summary: 'Get friends list',
    description:
      'Retrieve a list of all accepted friends for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Friends list retrieved successfully',
    type: FriendListResponseDto,
  })
  @Get()
  async getFriends(
    @CurrentUser() userId: string,
  ): Promise<FriendListResponseDto> {
    return this.friendsService.getFriends(userId);
  }

  @ApiOperation({
    summary: 'Get pending friend requests',
    description:
      'Retrieve all pending friend requests - both sent by the user and received by the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending requests retrieved successfully',
    type: PendingRequestsResponseDto,
  })
  @Get('requests')
  async getPendingRequests(
    @CurrentUser() userId: string,
  ): Promise<PendingRequestsResponseDto> {
    return this.friendsService.getPendingRequests(userId);
  }

  @ApiOperation({
    summary: 'Remove a friendship',
    description:
      'Remove an existing friendship. Both users involved in the friendship can perform this action.',
  })
  @ApiParam({
    name: 'friendshipId',
    description: 'The ID of the friendship to remove',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 204,
    description: 'Friendship removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Friendship not found or insufficient permissions',
  })
  @Delete(':friendshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(
    @CurrentUser() userId: string,
    @Param('friendshipId') friendshipId: string,
  ): Promise<void> {
    return this.friendsService.removeFriend(userId, friendshipId);
  }
}
