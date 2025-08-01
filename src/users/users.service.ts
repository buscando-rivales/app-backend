import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import {
  CreateUserDto,
  UpdateUserDto,
  SearchUsersDto,
  UserSearchResponseDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService,
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

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByNickname(nickname: string) {
    return this.prisma.user.findUnique({
      where: { nickname },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    // Obtener valores actuales para la métrica
    const currentUser = await this.prisma.user.findUnique({ where: { id } });

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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

    return updatedUser;
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
}
