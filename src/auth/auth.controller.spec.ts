import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { ClerkService } from './clerk.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoginDto } from './dto/login.dto';

// Mock del servicio ClerkService
const mockClerkService: Partial<ClerkService> = {
  generateAppToken: jest.fn(() => 'mocked-jwt'),
  verifyAndUpsertUser: jest.fn(() =>
    Promise.resolve({
      id: 'user-id',
      email: 'test@example.com',
      fullName: 'Test User',
      phone: null,
      avatarUrl: null,
      rating: null,
      nickname: null,
      roles: ['jugador'],
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ),
  createUserSession: jest.fn(),
  verifyAppToken: jest.fn(),
};

// Mock del servicio MetricsService
const mockMetricsService: Partial<MetricsService> = {
  logUserLogin: jest.fn(() => Promise.resolve()),
};

describe('AuthController', () => {
  let authController: AuthController;
  let clerkService: Partial<ClerkService>;
  let metricsService: Partial<MetricsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: ClerkService,
          useValue: mockClerkService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    clerkService = module.get<ClerkService>(ClerkService);
    metricsService = module.get<MetricsService>(MetricsService);
  });

  it('debería estar definido', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('debería validar el token Clerk y devolver un JWT', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: null,
        avatarUrl: null,
        rating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockJwt = 'mocked-jwt';

      (clerkService.verifyAndUpsertUser as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (clerkService.generateAppToken as jest.Mock).mockReturnValue(mockJwt);

      const loginDto: LoginDto = { token: 'mocked-clerk-token' };
      const mockReq = {
        headers: { 'user-agent': 'test-browser' },
        ip: '127.0.0.1',
      };

      const result = await authController.login(loginDto, mockReq);

      expect(clerkService.verifyAndUpsertUser).toHaveBeenCalledWith(
        'mocked-clerk-token',
      );
      expect(clerkService.generateAppToken).toHaveBeenCalledWith(mockUser);
      expect(metricsService.logUserLogin).toHaveBeenCalledWith({
        userId: mockUser.id,
        userAgent: 'test-browser',
        ipAddress: '127.0.0.1',
        loginMethod: 'clerk',
      });
      expect(result).toEqual({ token: mockJwt });
    });
  });
});
