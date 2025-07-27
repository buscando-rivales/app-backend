import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';

@ApiTags('games')
@ApiBearerAuth()
@Controller('games')
@UseGuards(ClerkAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new game' })
  @ApiBody({ type: CreateGameDto })
  @ApiResponse({ status: 201, description: 'Game created successfully' })
  create(@Body() createGameDto: CreateGameDto, @Req() req) {
    // Obtener organizerId del usuario autenticado (JWT)
    const organizerId = req.user.sub;
    return this.gamesService.create({ ...createGameDto, organizerId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({ status: 200, description: 'List of games' })
  findAll() {
    return this.gamesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a game by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Game found' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  findOne(@Param('id') id: string) {
    return this.gamesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a game by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateGameDto })
  @ApiResponse({ status: 200, description: 'Game updated successfully' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
    return this.gamesService.update(id, updateGameDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a game by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Game deleted successfully' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
