import { IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Enum representing the different states of a friendship
 */
export enum FriendStatus {
  /** Friend request is pending acceptance */
  PENDING = 'pending',
  /** Friend request has been accepted */
  ACCEPTED = 'accepted',
  /** Friend request has been rejected */
  REJECTED = 'rejected',
  /** User has been blocked */
  BLOCKED = 'blocked',
}

/**
 * DTO for adding a new friend
 */
export class AddFriendDto {
  @ApiProperty({
    description: 'The ID of the user to add as a friend',
    example: 'user_2NNEqL2vHPEFSZGWHZxf3l1c5Oa',
  })
  @IsString()
  friendId: string;
}

/**
 * DTO for updating a friend request status
 */
export class UpdateFriendRequestDto {
  @ApiProperty({
    description: 'The new status for the friend request',
    enum: FriendStatus,
    example: FriendStatus.ACCEPTED,
  })
  @IsEnum(FriendStatus)
  status: FriendStatus;
}

/**
 * User information included in friendship responses
 */
class UserInfo {
  @ApiProperty({
    description: 'User ID',
    example: 'user_2NNEqL2vHPEFSZGWHZxf3l1c5Oa',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'User nickname',
    example: 'johndoe',
    nullable: true,
  })
  nickname?: string | null;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'User rating (1-5 stars)',
    example: 4.5,
    nullable: true,
  })
  rating?: Decimal | null;
}

/**
 * DTO representing a friendship relationship
 */
export class FriendResponseDto {
  @ApiProperty({
    description: 'Unique friendship ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who initiated the friend request',
    example: 'user_2NNEqL2vHPEFSZGWHZxf3l1c5Oa',
  })
  user_id: string;

  @ApiProperty({
    description: 'ID of the user who received the friend request',
    example: 'user_2NNEqL2vHPEFSZGWHZxf3l1c5Ob',
  })
  friend_id: string;

  @ApiProperty({
    description: 'Current status of the friendship',
    enum: FriendStatus,
    example: FriendStatus.ACCEPTED,
  })
  status: FriendStatus;

  @ApiProperty({
    description: 'Date and time when the friendship was created',
    example: '2025-07-30T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Date and time when the friendship was last updated',
    example: '2025-07-30T11:15:00Z',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'Information about the friend (when user is the initiator)',
    type: UserInfo,
  })
  friend?: UserInfo;

  @ApiPropertyOptional({
    description: 'Information about the user (when user is the recipient)',
    type: UserInfo,
  })
  user?: UserInfo;
}

/**
 * DTO representing a list of friends
 */
export class FriendListResponseDto {
  @ApiProperty({
    description: 'Array of friends',
    type: [FriendResponseDto],
  })
  friends: FriendResponseDto[];

  @ApiProperty({
    description: 'Total number of friends',
    example: 15,
  })
  total: number;
}

/**
 * DTO representing pending friend requests (sent and received)
 */
export class PendingRequestsResponseDto {
  @ApiProperty({
    description: 'Friend requests sent by the current user',
    type: [FriendResponseDto],
  })
  sentRequests: FriendResponseDto[];

  @ApiProperty({
    description: 'Friend requests received by the current user',
    type: [FriendResponseDto],
  })
  receivedRequests: FriendResponseDto[];

  @ApiProperty({
    description: 'Total number of sent requests',
    example: 3,
  })
  totalSent: number;

  @ApiProperty({
    description: 'Total number of received requests',
    example: 2,
  })
  totalReceived: number;
}
