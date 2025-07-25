import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateUser(userData: {
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
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async updateUserRating(id: string, rating: number) {
    return this.prisma.user.update({
      where: { id },
      data: { rating },
    });
  }
}
