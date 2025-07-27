import { Controller, Post, Body } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly clerkService: ClerkService) {}

  @Post('token')
  async generateToken(@Body() generateTokenDto: GenerateTokenDto) {
    const token = await this.clerkService.createUserSession(
      generateTokenDto.userId,
    );
    return { token };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // 1. Validar token Clerk y obtener usuario
    const user = await this.clerkService.verifyAndUpsertUser(loginDto.token);
    // 2. Generar y devolver token propio
    const appToken = this.clerkService.generateAppToken(user);
    return { token: appToken };
  }
}
