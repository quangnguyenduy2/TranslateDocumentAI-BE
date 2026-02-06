import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { Session } from '../database/entities/session.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleUserDto } from './dto/google-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User> }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Get default 'user' role (create if not exists)
    let userRole = await this.roleRepository.findOne({ where: { name: 'user' } });
    if (!userRole) {
      userRole = this.roleRepository.create({
        name: 'user',
        permissions: ['translate'],
      });
      await this.roleRepository.save(userRole);
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      roleId: userRole.id,
      isActive: true,
    });

    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (not a Google-only user)
    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async generateTokens(
    user: User,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role.name };

    // Access token (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Refresh token (7 days)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // Save session
    const session = this.sessionRepository.create({
      userId: user.id,
      accessToken: await bcrypt.hash(accessToken, 10),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      ipAddress,
      userAgent,
    });
    await this.sessionRepository.save(session);

    // Save refresh token
    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      token: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  async refresh(
    oldRefreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify and decode old refresh token
    let payload;
    try {
      payload = this.jwtService.verify(oldRefreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find refresh token in database
    const tokens = await this.refreshTokenRepository.find({
      where: { userId: payload.sub, isRevoked: false },
    });

    let validToken: RefreshToken | null = null;
    for (const token of tokens) {
      const isValid = await bcrypt.compare(oldRefreshToken, token.token);
      if (isValid && token.expiresAt > new Date()) {
        validToken = token;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // Revoke old refresh token (TOKEN ROTATION)
    validToken.isRevoked = true;
    await this.refreshTokenRepository.save(validToken);

    // Generate new token pair
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['role'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user, ipAddress, userAgent);
  }

  async logout(userId: string, accessToken: string): Promise<void> {
    // Revoke all sessions and refresh tokens for this user
    await this.sessionRepository.delete({ userId });
    await this.refreshTokenRepository.update({ userId }, { isRevoked: true });
  }

  async validateSession(accessToken: string): Promise<Session | null> {
    const sessions = await this.sessionRepository.find({
      where: { expiresAt: LessThan(new Date()) },
    });

    for (const session of sessions) {
      const isValid = await bcrypt.compare(accessToken, session.accessToken);
      if (isValid && session.expiresAt > new Date()) {
        return session;
      }
    }

    return null;
  }

  async updateApiKey(userId: string, apiKey: string): Promise<void> {
    await this.userRepository.update(userId, { apiKey });
  }

  async getApiKey(userId: string): Promise<string | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.apiKey || null;
  }

  async findOrCreateGoogleUser(googleUserDto: GoogleUserDto): Promise<User> {
    const { googleId, email, displayName, profilePicture } = googleUserDto;

    // First, try to find user by googleId
    let user = await this.userRepository.findOne({
      where: { googleId },
      relations: ['role'],
    });

    if (user) {
      return user;
    }

    // If not found by googleId, check if email exists (auto-link)
    user = await this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (user) {
      // Auto-link: update existing user with Google info
      user.googleId = googleId;
      if (profilePicture) {
        user.profilePicture = profilePicture;
      }
      await this.userRepository.save(user);
      return user;
    }

    // Create new user
    let userRole = await this.roleRepository.findOne({ where: { name: 'user' } });
    if (!userRole) {
      userRole = this.roleRepository.create({
        name: 'user',
        permissions: ['translate'],
      });
      await this.roleRepository.save(userRole);
    }

    const newUser = new User();
    newUser.email = email;
    newUser.googleId = googleId;
    newUser.profilePicture = profilePicture || null;
    newUser.roleId = userRole.id;
    newUser.isActive = true;
    newUser.passwordHash = null;

    await this.userRepository.save(newUser);
    
    const savedUser = await this.userRepository.findOne({
      where: { id: newUser.id },
      relations: ['role'],
    });
    
    if (!savedUser) {
      throw new Error('Failed to create user');
    }
    
    return savedUser;
  }
}
