import { IsString, IsObject, IsOptional } from 'class-validator';

export enum MetricEventType {
  USER_LOGGED_IN = 'user_logged_in',
  USER_SIGNED_UP = 'user_signed_up',
  USER_UPDATED_PROFILE = 'user_updated_profile',
  SEARCH_NEARBY_GAMES = 'search_nearby_games',
  USER_SENT_FRIEND_REQUEST = 'user_sent_friend_request',
  USER_ACCEPTED_FRIEND_REQUEST = 'user_accepted_friend_request',
  USER_REJECTED_FRIEND_REQUEST = 'user_rejected_friend_request',
  NOTIFICATION_SENT = 'notification_sent',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
}

export class CreateMetricDto {
  @IsString()
  eventType: MetricEventType;

  @IsObject()
  eventData: Record<string, any>;
}

export class GetMetricsDto {
  @IsOptional()
  @IsString()
  eventType?: MetricEventType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  limit?: number = 100;

  @IsOptional()
  offset?: number = 0;
}

export interface UserLoginMetric {
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  loginMethod?: string;
}

export interface UserSignUpMetric {
  userId: string;
  email: string;
  signUpMethod?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface UserUpdatedProfileMetric {
  userId: string;
  fieldsUpdated: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export interface SearchNearbyGamesMetric {
  userId: string;
  searchCriteria: {
    latitude: number;
    longitude: number;
    radius?: number;
    gameType?: number;
    gameLevel?: number;
    maxPrice?: number;
  };
  resultsCount: number;
}

export interface UserSentFriendRequestMetric {
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
}

export interface UserAcceptedFriendRequestMetric {
  accepterId: string;
  requesterId: string;
  accepterName?: string;
  requesterName?: string;
}

export interface UserRejectedFriendRequestMetric {
  rejecterId: string;
  requesterId: string;
  rejecterName?: string;
  requesterName?: string;
}

export interface NotificationSentMetric {
  userId: string;
  notificationType: string;
  notificationTitle: string;
  deliveryMethod: 'websocket' | 'push' | 'email';
  success: boolean;
}

export interface ChatMessageSentMetric {
  userId: string;
  roomId: string;
  messageLength: number;
  gameId?: string;
}
