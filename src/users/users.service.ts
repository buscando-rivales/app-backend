import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  SearchUsersDto,
  UserSearchResponseDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  createUser(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
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

  updateUser(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
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
