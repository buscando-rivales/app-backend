import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Query,
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
  getProfile(@Req() req) {
    const userId = req.user.sub;
    return this.usersService.findUserById(userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @CurrentUser() userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(userId, updateUserDto);
  }
}
