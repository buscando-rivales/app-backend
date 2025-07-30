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

@Controller('friends')
@UseGuards(ClerkAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addFriend(
    @CurrentUser() userId: string,
    @Body() addFriendDto: AddFriendDto,
  ): Promise<FriendResponseDto> {
    return this.friendsService.addFriend(userId, addFriendDto);
  }

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

  @Get()
  async getFriends(
    @CurrentUser() userId: string,
  ): Promise<FriendListResponseDto> {
    return this.friendsService.getFriends(userId);
  }

  @Get('requests')
  async getPendingRequests(
    @CurrentUser() userId: string,
  ): Promise<PendingRequestsResponseDto> {
    return this.friendsService.getPendingRequests(userId);
  }

  @Delete(':friendshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(
    @CurrentUser() userId: string,
    @Param('friendshipId') friendshipId: string,
  ): Promise<void> {
    return this.friendsService.removeFriend(userId, friendshipId);
  }
}
