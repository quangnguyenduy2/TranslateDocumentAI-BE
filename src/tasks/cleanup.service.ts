import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Session } from '../database/entities/session.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens() {
    this.logger.log('Starting daily cleanup of expired tokens...');

    const now = new Date();

    try {
      // Delete expired sessions
      const deletedSessions = await this.sessionRepository.delete({
        expiresAt: LessThan(now),
      });

      // Delete expired or revoked refresh tokens
      const deletedTokens = await this.refreshTokenRepository.delete({
        expiresAt: LessThan(now),
      });

      this.logger.log(
        `Cleanup complete: ${deletedSessions.affected || 0} sessions, ${deletedTokens.affected || 0} refresh tokens deleted`,
      );
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }

  // Manual cleanup endpoint (can be called by admin)
  async manualCleanup(): Promise<{ sessions: number; tokens: number }> {
    const now = new Date();

    const deletedSessions = await this.sessionRepository.delete({
      expiresAt: LessThan(now),
    });

    const deletedTokens = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    return {
      sessions: deletedSessions.affected || 0,
      tokens: deletedTokens.affected || 0,
    };
  }
}
