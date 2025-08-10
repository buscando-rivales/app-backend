import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { DateService } from '../utils/date.service';
import {
  CreateUserDto,
  UpdateUserDto,
  SearchUsersDto,
  UserSearchResponseDto,
} from './dto/user.dto';
import {
  UserSportPositionDto,
  CreateUserSportPositionDto,
  UpdateUserSportPositionDto,
} from './dto/user-sport-position.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
    private dateService: DateService,
  ) {}

  createOrUpdateUser(userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.user.upsert({
      where: { id: userData.id },
      update: {
        email: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
      },
      create: {
        id: userData.id,
        email: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: createUserDto,
    });

    // Loguear métrica de registro de usuario
    try {
      await this.metricsService.logUserSignUp({
        userId: user.id,
        email: user.email,
        signUpMethod: 'manual', // Asumiendo registro manual, podrías agregar este campo al DTO
      });
    } catch (error) {
      console.error('Error logging user signup metric:', error);
    }

    return user;
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    // Calcular la edad si hay fecha de nacimiento
    const age = this.dateService.calculateAge(user.birth_date);

    // Devolver el usuario con la edad calculada
    return {
      ...user,
      age,
    };
  }

  findByNickname(nickname: string) {
    return this.prisma.user.findUnique({
      where: { nickname },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    // Obtener valores actuales para la métrica
    const currentUser = await this.prisma.user.findUnique({ where: { id } });

    // Usar el método toPrismaData() del DTO para la transformación
    const prismaData = updateUserDto.toPrismaData();

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: prismaData,
    });

    // Loguear métrica de actualización de perfil
    if (currentUser) {
      try {
        await this.metricsService.logUserUpdatedProfile({
          userId: id,
          fieldsUpdated: Object.keys(updateUserDto),
          previousValues: Object.fromEntries(
            Object.keys(updateUserDto).map((key) => [key, currentUser[key]]),
          ),
          newValues: updateUserDto,
        });
      } catch (error) {
        console.error('Error logging user profile update metric:', error);
      }
    }

    // Calcular la edad para incluir en la respuesta
    const age = this.dateService.calculateAge(updatedUser.birth_date);

    return {
      ...updatedUser,
      age,
    };
  }

  updateUserRating(id: string, rating: number) {
    return this.prisma.user.update({
      where: { id },
      data: { rating },
    });
  }

  async searchUsersByNickname(
    searchDto: SearchUsersDto,
  ): Promise<UserSearchResponseDto> {
    const { query, limit = 10 } = searchDto;

    // Buscar usuarios que tengan nickname y que coincida con la query
    const users = await this.prisma.user.findMany({
      where: {
        nickname: {
          not: null,
          contains: query,
          mode: 'insensitive', // Case insensitive search
        },
      },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        avatarUrl: true,
        rating: true,
      },
      take: limit,
      orderBy: [
        // Primero usuarios cuyo nickname comience con la query
        {
          nickname: 'asc',
        },
        // Luego por rating descendente
        {
          rating: 'desc',
        },
      ],
    });

    // Filtrar usuarios que efectivamente tengan nickname (TypeScript safety)
    // y convertir Decimal a number para rating
    const formattedUsers = users
      .filter((user) => user.nickname !== null)
      .map((user) => ({
        id: user.id,
        fullName: user.fullName,
        nickname: user.nickname as string, // Safe cast ya que filtramos arriba
        avatarUrl: user.avatarUrl,
        rating: user.rating ? Number(user.rating) : null,
      }));

    return {
      users: formattedUsers,
      total: formattedUsers.length,
      query,
    };
  }

  // Métodos para gestionar deportes y posiciones del usuario
  async getUserSportsPositions(
    userId: string,
  ): Promise<UserSportPositionDto[]> {
    const userPositions = await this.prisma.user_positions.findMany({
      where: {
        user_id: userId,
      },
      include: {
        positions: {
          include: {
            sports: true,
          },
        },
      },
    });

    return userPositions.map((up) => ({
      user_id: up.user_id,
      position_id: up.position_id,
      position: {
        id: up.positions.id,
        name: up.positions.name,
        type: up.positions.type,
        sport: {
          id: up.positions.sports.id,
          name: up.positions.sports.name,
          code: up.positions.sports.code,
        },
      },
    }));
  }

  async addUserSportPosition(
    userId: string,
    data: CreateUserSportPositionDto,
  ): Promise<UserSportPositionDto> {
    // Validar que los datos estén presentes
    if (!data || !data.position_id) {
      throw new Error('Position ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Verificar si ya existe esta posición para el usuario
    const existingPosition = await this.prisma.user_positions.findUnique({
      where: {
        user_id_position_id: {
          user_id: userId,
          position_id: data.position_id,
        },
      },
    });

    if (existingPosition) {
      throw new Error('User already has this position assigned');
    }

    // Obtener información de la posición para verificar el deporte
    const position = await this.prisma.positions.findUnique({
      where: { id: data.position_id },
      include: { sports: true },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    // Verificar si el usuario ya tiene una posición para este deporte
    const existingForSport = await this.prisma.user_positions.findFirst({
      where: {
        user_id: userId,
        positions: {
          sport_id: position.sport_id,
        },
      },
    });

    if (existingForSport) {
      // Si ya tiene una posición para este deporte, eliminar la anterior
      await this.prisma.user_positions.delete({
        where: {
          user_id_position_id: {
            user_id: userId,
            position_id: existingForSport.position_id,
          },
        },
      });
    }

    // Crear la nueva posición
    const created = await this.prisma.user_positions.create({
      data: {
        user_id: userId,
        position_id: data.position_id,
      },
      include: {
        positions: {
          include: {
            sports: true,
          },
        },
      },
    });

    return {
      user_id: created.user_id,
      position_id: created.position_id,
      position: {
        id: created.positions.id,
        name: created.positions.name,
        type: created.positions.type,
        sport: {
          id: created.positions.sports.id,
          name: created.positions.sports.name,
          code: created.positions.sports.code,
        },
      },
    };
  }

  async updateUserSportPosition(
    userId: string,
    positionId: string,
    data: UpdateUserSportPositionDto,
  ): Promise<UserSportPositionDto> {
    // Verificar que la posición actual existe
    const currentPosition = await this.prisma.user_positions.findUnique({
      where: {
        user_id_position_id: {
          user_id: userId,
          position_id: positionId,
        },
      },
      include: {
        positions: {
          include: {
            sports: true,
          },
        },
      },
    });

    if (!currentPosition) {
      throw new Error('Position not found for this user');
    }

    // Verificar que la nueva posición existe y es del mismo deporte
    const newPosition = await this.prisma.positions.findUnique({
      where: { id: data.position_id },
      include: { sports: true },
    });

    if (!newPosition) {
      throw new Error('New position not found');
    }

    if (newPosition.sport_id !== currentPosition.positions.sport_id) {
      throw new Error('New position must be from the same sport');
    }

    // Eliminar la posición actual
    await this.prisma.user_positions.delete({
      where: {
        user_id_position_id: {
          user_id: userId,
          position_id: positionId,
        },
      },
    });

    // Crear la nueva posición
    const updated = await this.prisma.user_positions.create({
      data: {
        user_id: userId,
        position_id: data.position_id,
      },
      include: {
        positions: {
          include: {
            sports: true,
          },
        },
      },
    });

    return {
      user_id: updated.user_id,
      position_id: updated.position_id,
      position: {
        id: updated.positions.id,
        name: updated.positions.name,
        type: updated.positions.type,
        sport: {
          id: updated.positions.sports.id,
          name: updated.positions.sports.name,
          code: updated.positions.sports.code,
        },
      },
    };
  }

  async removeUserSportPosition(
    userId: string,
    positionId: string,
  ): Promise<void> {
    const deleted = await this.prisma.user_positions.delete({
      where: {
        user_id_position_id: {
          user_id: userId,
          position_id: positionId,
        },
      },
    });

    if (!deleted) {
      throw new Error('Position not found for this user');
    }
  }
}
