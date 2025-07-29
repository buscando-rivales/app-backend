import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from './clerk.service';
import { PrismaService } from '../services/prisma.service';
import * as jwt from 'jsonwebtoken';

jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({
    sessions: {
      createSession: jest.fn(function (this: void) {
        return { id: 'session-id' };
      }),
      getToken: jest.fn(function (this: void) {
        return 'clerk-session-token';
      }),
    },
    users: {
      getUser: jest.fn(function (this: void) {
        return {
          id: 'user-id',
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          fullName: 'Test User',
        };
      }),
    },
  })),
  verifyToken: jest.fn(function (this: void) {
    return { sub: 'user-id' };
  }),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
  verify: jest.fn(),
}));

describe('ClerkService', () => {
  let clerkService: ClerkService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              upsert: jest.fn(() => ({
                id: 'user-id',
                email: 'test@example.com',
                fullName: 'Test User',
              })),
            },
          },
        },
      ],
    }).compile();

    clerkService = module.get<ClerkService>(ClerkService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('debería estar definido', () => {
    expect(clerkService).toBeDefined();
  });

  describe('generateAppToken', () => {
    it('debería generar un token JWT', () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        fullName: 'Test User',
      };
      const token = clerkService.generateAppToken(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          fullName: user.fullName,
          roles: [],
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
      );
      expect(token).toBeDefined();
    });
  });

  describe('verifyAndUpsertUser', () => {
    it('debería verificar el token y crear/actualizar el usuario', async () => {
      const token = 'mocked-clerk-token';
      const user = await clerkService.verifyAndUpsertUser(token);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prismaService.user.upsert).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        update: {
          email: 'test@example.com',
          fullName: 'Test User',
          avatarUrl: null, // Ajuste para incluir avatarUrl
        },
        create: {
          id: 'user-id',
          email: 'test@example.com',
          fullName: 'Test User',
          avatarUrl: null, // Ajuste para incluir avatarUrl
        },
      });
      expect(user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        fullName: 'Test User',
      });
    });
  });
});
