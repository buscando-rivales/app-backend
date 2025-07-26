import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import {
  FieldFiltersDto,
  FieldResponseDto,
  PaginatedFieldsResponseDto,
} from './dto/field.dto';

@ApiTags('fields')
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de canchas con paginación y filtros',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de canchas obtenida exitosamente',
    type: PaginatedFieldsResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página (comenzando en 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de elementos por página (máximo 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por nombre o dirección de la cancha',
    example: 'futbol 5',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Precio mínimo por hora',
    example: 5000,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Precio máximo por hora',
    example: 10000,
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Latitud para búsqueda por cercanía',
    example: -31.7372657,
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Longitud para búsqueda por cercanía',
    example: -60.5265549,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radio de búsqueda en kilómetros (solo con lat/lng)',
    example: 5,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Campo por el cual ordenar',
    enum: ['name', 'price', 'distance'],
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Orden de clasificación',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  async findAll(
    @Query() filters: FieldFiltersDto,
  ): Promise<PaginatedFieldsResponseDto> {
    return this.fieldsService.findAll(filters);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener canchas cercanas a una ubicación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de canchas cercanas obtenida exitosamente',
    type: [FieldResponseDto],
  })
  @ApiQuery({
    name: 'latitude',
    required: true,
    description: 'Latitud de la ubicación',
    example: -31.7372657,
  })
  @ApiQuery({
    name: 'longitude',
    required: true,
    description: 'Longitud de la ubicación',
    example: -60.5265549,
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radio de búsqueda en kilómetros',
    example: 5,
  })
  async findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ): Promise<FieldResponseDto[]> {
    if (!latitude || !longitude) {
      throw new NotFoundException('Latitude and longitude are required');
    }
    return this.fieldsService.findNearby(latitude, longitude, radius);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cancha por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la cancha',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cancha obtenida exitosamente',
    type: FieldResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cancha no encontrada',
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<FieldResponseDto> {
    const field = await this.fieldsService.findOne(id);
    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }
    return field;
  }
}
