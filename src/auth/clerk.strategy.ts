import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Clerk } from '@clerk/clerk-sdk-node';

interface JwtPayload {
  sub: string;
  [key: string]: any;
}

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  private readonly clerk: ReturnType<typeof Clerk>;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() as unknown as (
        request: Request,
      ) => string | null,
      secretOrKey: process.env.CLERK_JWT_PUBLIC_KEY,
    });

    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not defined');
    }

    this.clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      const user = await this.clerk.users.getUser(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.emailAddresses?.length) {
        throw new UnauthorizedException('User has no email address');
      }

      return {
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Clerk authentication error:', error.message);
      } else {
        console.error('Clerk authentication error:', error);
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
