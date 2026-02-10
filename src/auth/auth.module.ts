import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { Session } from '../database/entities/session.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Session, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  // providers: [AuthService, JwtStrategy, GoogleStrategy],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
