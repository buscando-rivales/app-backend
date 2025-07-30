import { IsString, IsEnum } from 'class-validator';
import { Decimal } from '@prisma/client/runtime/library';

export enum FriendStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

export class AddFriendDto {
  @IsString()
  friendId: string;
}

export class UpdateFriendRequestDto {
  @IsEnum(FriendStatus)
  status: FriendStatus;
}

export class FriendResponseDto {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
  created_at: Date;
  updated_at: Date;
  friend?: {
    id: string;
    fullName: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    rating?: Decimal | null;
  };
  user?: {
    id: string;
    fullName: string;
    nickname?: string | null;
    avatarUrl?: string | null;
    rating?: Decimal | null;
  };
}

export class FriendListResponseDto {
  friends: FriendResponseDto[];
  total: number;
}

export class PendingRequestsResponseDto {
  sentRequests: FriendResponseDto[];
  receivedRequests: FriendResponseDto[];
  totalSent: number;
  totalReceived: number;
}
