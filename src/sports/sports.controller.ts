import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { SportsService } from './sports.service';
import { SportDto, PositionDto, SportWithPositionsDto } from './dto/sport.dto';

@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Get()
  async findAllSports(): Promise<SportDto[]> {
    return this.sportsService.findAllSports();
  }

  @Get('with-positions')
  async findSportsWithPositions(): Promise<SportWithPositionsDto[]> {
    return this.sportsService.findSportsWithPositions();
  }

  @Get(':sportId/positions')
  async findPositionsBySport(
    @Param('sportId', ParseUUIDPipe) sportId: string,
    @Query('type') type?: string,
  ): Promise<PositionDto[]> {
    return this.sportsService.findPositionsBySport(sportId, type);
  }
}
