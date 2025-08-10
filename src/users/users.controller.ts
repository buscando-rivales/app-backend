import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { CurrentUser } from '../decorators/user.decorator';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { SearchUsersDto, UserSearchResponseDto } from './dto/user-search.dto';
import {
  UserSportPositionDto,
  CreateUserSportPositionDto,
  UpdateUserSportPositionDto,
} from './dto/user-sport-position.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search users by nickname',
    description: 'Buscar usuarios por nickname para encontrar posibles amigos',
  })
  @ApiQuery({
    name: 'query',
    description: 'Texto de búsqueda para buscar usuarios por nickname',
    example: 'player123',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Límite de resultados (máximo 50)',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuarios encontrados exitosamente',
    type: UserSearchResponseDto,
  })
  searchUsers(@Query() searchDto: SearchUsersDto) {
    return this.usersService.searchUsersByNickname(searchDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiQuery({
    name: 'include',
    required: false,
    description: 'Include additional data (sports)',
  })
  async getProfile(@Req() req, @Query('include') include?: string) {
    const userId = req.user.sub;
    const profile = await this.usersService.findUserById(userId);

    if (include === 'sports') {
      const sports = await this.usersService.getUserSportsPositions(userId);
      return {
        ...profile,
        sports,
      };
    }

    return profile;
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @CurrentUser() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(userId, updateUserDto);
  }

  // Endpoints para deportes y posiciones
  @Get('profile/sports')
  @ApiOperation({ summary: 'Get user sports and positions' })
  getUserSportsPositions(
    @CurrentUser() userId: string,
  ): Promise<UserSportPositionDto[]> {
    return this.usersService.getUserSportsPositions(userId);
  }

  @Post('profile/sports')
  @ApiOperation({ summary: 'Add sport position to user' })
  addUserSportPosition(
    @CurrentUser() userId: string,
    @Body() data: CreateUserSportPositionDto,
  ): Promise<UserSportPositionDto> {
    return this.usersService.addUserSportPosition(userId, data);
  }

  @Put('profile/sports/:positionId')
  @ApiOperation({ summary: 'Update user sport position' })
  updateUserSportPosition(
    @CurrentUser() userId: string,
    @Param('positionId', ParseUUIDPipe) positionId: string,
    @Body() data: UpdateUserSportPositionDto,
  ): Promise<UserSportPositionDto> {
    return this.usersService.updateUserSportPosition(userId, positionId, data);
  }

  @Delete('profile/sports/:positionId')
  @ApiOperation({ summary: 'Remove sport position from user' })
  removeUserSportPosition(
    @CurrentUser() userId: string,
    @Param('positionId', ParseUUIDPipe) positionId: string,
  ): Promise<void> {
    return this.usersService.removeUserSportPosition(userId, positionId);
  }
}
