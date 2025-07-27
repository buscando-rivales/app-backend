import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ClerkService } from './clerk.service';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { LoginDto } from './dto/login.dto';
import { ClerkAuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly clerkService: ClerkService) {}

  @Post('token')
  @ApiOperation({ summary: 'Generate Clerk session token' })
  @ApiBody({ type: GenerateTokenDto })
  @ApiResponse({
    status: 201,
    description: 'Session token generated',
    schema: { example: { token: '...' } },
  })
  async generateToken(@Body() generateTokenDto: GenerateTokenDto) {
    const token = await this.clerkService.createUserSession(
      generateTokenDto.userId,
    );
    return { token };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with Clerk token and get app JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'App JWT generated',
    schema: { example: { token: '...' } },
  })
  async login(@Body() loginDto: LoginDto) {
    // 1. Validar token Clerk y obtener usuario
    const user = await this.clerkService.verifyAndUpsertUser(loginDto.token);
    // 2. Generar y devolver token propio
    const appToken = this.clerkService.generateAppToken(user);
    return { token: appToken };
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint to validate JWT' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Returns ok and user if JWT is valid',
    schema: {
      example: {
        ok: true,
        user: { sub: '...', email: '...', fullName: '...', roles: [] },
      },
    },
  })
  @UseGuards(ClerkAuthGuard)
  test(@Req() req) {
    return { ok: true, user: req.user };
  }
}
