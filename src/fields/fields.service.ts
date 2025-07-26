import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import {
  FieldFiltersDto,
  FieldResponseDto,
  PaginatedFieldsResponseDto,
} from './dto/field.dto';

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: FieldFiltersDto): Promise<PaginatedFieldsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      sortBy = 'name',
      sortOrder = 'asc',
    } = filters;

    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereConditions.basePricePerHour = {};
      if (minPrice !== undefined) {
        whereConditions.basePricePerHour.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        whereConditions.basePricePerHour.lte = maxPrice;
      }
    }

    // Si se proporciona ubicación, usar búsqueda geográfica
    if (latitude !== undefined && longitude !== undefined) {
      return this.findByLocation(filters);
    }

    // Construir orden
    let orderBy: any = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'price') {
      orderBy = { basePricePerHour: sortOrder };
    } else {
      orderBy = { name: 'asc' }; // default
    }

    // Ejecutar consultas en paralelo
    const [fields, total] = await Promise.all([
      this.prisma.field.findMany({
        where: whereConditions,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          address: true,
          longitude: true,
          latitude: true,
          phone: true,
          openingTime: true,
          closingTime: true,
          basePricePerHour: true,
          amenities: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.field.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: fields.map((field) => ({
        ...field,
        phone: field.phone || undefined,
        basePricePerHour: field.basePricePerHour
          ? Number(field.basePricePerHour)
          : undefined,
        openingTime: field.openingTime.toISOString().substr(11, 8),
        closingTime: field.closingTime.toISOString().substr(11, 8),
      })),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findByLocation(
    filters: FieldFiltersDto,
  ): Promise<PaginatedFieldsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      radius = 5,
      sortBy = 'distance',
      sortOrder = 'asc',
    } = filters;

    const skip = (page - 1) * limit;
    const radiusInMeters = radius * 1000; // Convertir km a metros

    // Construir la consulta SQL base
    let whereClause = `ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`;
    const params: any[] = [longitude, latitude, radiusInMeters];
    let paramIndex = 4;

    // Agregar filtros adicionales
    const additionalConditions: string[] = [];

    if (search) {
      additionalConditions.push(
        `(name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`,
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      additionalConditions.push(`base_price_per_hour >= $${paramIndex}`);
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      additionalConditions.push(`base_price_per_hour <= $${paramIndex}`);
      params.push(maxPrice);
      paramIndex++;
    }

    if (additionalConditions.length > 0) {
      whereClause += ` AND ${additionalConditions.join(' AND ')}`;
    }

    // Construir orden
    let orderClause = '';
    if (sortBy === 'distance') {
      orderClause = `ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) ${sortOrder}`;
    } else if (sortBy === 'name') {
      orderClause = `ORDER BY name ${sortOrder}`;
    } else if (sortBy === 'price') {
      orderClause = `ORDER BY base_price_per_hour ${sortOrder}`;
    } else {
      orderClause = `ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) ASC`;
    }

    // Consulta para obtener los campos
    const fieldsQuery = `
      SELECT 
        id,
        name,
        address,
        phone,
        opening_time,
        closing_time,
        base_price_per_hour,
        amenities,
        created_at,
        updated_at,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM fields 
      WHERE ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Consulta para el conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM fields 
      WHERE ${whereClause}
    `;

    params.push(limit, skip);

    // Ejecutar consultas
    const [fieldsResult, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe(fieldsQuery, ...params),
      this.prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)), // Sin limit y offset para el count
    ]);

    const fields = fieldsResult as any[];
    const total = Number((countResult as any[])[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: fields.map((field) => ({
        id: field.id,
        name: field.name,
        address: field.address,
        phone: field.phone,
        openingTime: field.opening_time,
        closingTime: field.closing_time,
        basePricePerHour: Number(field.base_price_per_hour),
        amenities: field.amenities,
        createdAt: field.created_at,
        updatedAt: field.updated_at,
        distance: Math.round(Number(field.distance)),
      })),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string): Promise<FieldResponseDto | null> {
    const field = await this.prisma.field.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        openingTime: true,
        closingTime: true,
        basePricePerHour: true,
        amenities: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!field) {
      return null;
    }

    return {
      ...field,
      phone: field.phone || undefined,
      basePricePerHour: field.basePricePerHour
        ? Number(field.basePricePerHour)
        : undefined,
      openingTime: field.openingTime.toISOString().substr(11, 8),
      closingTime: field.closingTime.toISOString().substr(11, 8),
    };
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ): Promise<FieldResponseDto[]> {
    const radiusInMeters = radiusKm * 1000;

    const query = `
      SELECT 
        id,
        name,
        address,
        phone,
        opening_time,
        closing_time,
        base_price_per_hour,
        amenities,
        created_at,
        updated_at,
        ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM fields 
      WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance ASC
    `;

    const fields = await this.prisma.$queryRawUnsafe(
      query,
      longitude,
      latitude,
      radiusInMeters,
    );

    return (fields as any[]).map((field) => ({
      id: field.id,
      name: field.name,
      address: field.address,
      phone: field.phone,
      openingTime: field.opening_time,
      closingTime: field.closing_time,
      basePricePerHour: Number(field.base_price_per_hour),
      amenities: field.amenities,
      createdAt: field.created_at,
      updatedAt: field.updated_at,
      distance: Math.round(Number(field.distance)),
    }));
  }
}
