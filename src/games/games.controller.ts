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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';
import { GamePlayersResponseDto } from './dto/game-player.dto';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { ParseUUIDPipe } from '@nestjs/common/pipes';

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

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby games' })
  @ApiQuery({ name: 'latitude', type: Number, required: true })
  @ApiQuery({ name: 'longitude', type: Number, required: true })
  @ApiQuery({ name: 'radius', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'List of nearby games' })
  findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number,
  ) {
    return this.gamesService.findNearby(latitude, longitude, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a game by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Game found' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
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

  // Endpoints para manejar jugadores en juegos

  @Post(':id/join')
  @ApiOperation({
    summary: 'Join a game',
    description: 'Permite a un usuario unirse a un juego disponible',
  })
  @ApiParam({ name: 'id', description: 'ID del juego', type: String })
  @ApiResponse({
    status: 201,
    description: 'Usuario unido al juego exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'No hay espacios disponibles o juego no está abierto',
  })
  @ApiResponse({ status: 404, description: 'Juego no encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario ya está en el juego' })
  joinGame(@Param('id', ParseUUIDPipe) gameId: string, @Req() req) {
    const playerId = req.user.sub;
    return this.gamesService.joinGame(gameId, playerId);
  }

  @Post(':id/leave')
  @ApiOperation({
    summary: 'Leave a game',
    description: 'Permite a un usuario salirse de un juego',
  })
  @ApiParam({ name: 'id', description: 'ID del juego', type: String })
  @ApiResponse({
    status: 200,
    description: 'Usuario salió del juego exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Usuario no está unido al juego' })
  @ApiResponse({ status: 404, description: 'Juego o jugador no encontrado' })
  leaveGame(@Param('id', ParseUUIDPipe) gameId: string, @Req() req) {
    const playerId = req.user.sub;
    return this.gamesService.leaveGame(gameId, playerId);
  }

  @Get(':id/players')
  @ApiOperation({
    summary: 'Get game players',
    description: 'Obtiene la lista de jugadores de un juego',
  })
  @ApiParam({ name: 'id', description: 'ID del juego', type: String })
  @ApiResponse({
    status: 200,
    description: 'Lista de jugadores obtenida exitosamente',
    type: GamePlayersResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Juego no encontrado' })
  getGamePlayers(@Param('id', ParseUUIDPipe) gameId: string) {
    return this.gamesService.getGamePlayers(gameId);
  }

  @Post(':id/kick/:playerId')
  @ApiOperation({
    summary: 'Kick a player from game',
    description: 'Permite al organizador expulsar a un jugador del juego',
  })
  @ApiParam({ name: 'id', description: 'ID del juego', type: String })
  @ApiParam({
    name: 'playerId',
    description: 'ID del jugador a expulsar',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Jugador expulsado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Solo el organizador puede expulsar jugadores',
  })
  @ApiResponse({ status: 404, description: 'Juego o jugador no encontrado' })
  kickPlayer(
    @Param('id', ParseUUIDPipe) gameId: string,
    @Param('playerId') playerId: string,
    @Req() req,
  ) {
    const organizerId = req.user.sub;
    return this.gamesService.kickPlayer(gameId, playerId, organizerId);
  }
}
