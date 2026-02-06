import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Session } from './entities/session.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsageLog } from './entities/usage-log.entity';
import { GlossaryItem } from './entities/glossary-item.entity';
import { BlacklistItem } from './entities/blacklist-item.entity';
import { TranslationHistory } from './entities/translation-history.entity';
import { UserPreference } from './entities/user-preference.entity';
import { DefaultGlossary } from './entities/default-glossary.entity';
import { DefaultBlacklist } from './entities/default-blacklist.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'translate_ai'),
        entities: [User, Role, Session, RefreshToken, UsageLog, GlossaryItem, BlacklistItem, TranslationHistory, UserPreference, DefaultGlossary, DefaultBlacklist],
        synchronize: configService.get('NODE_ENV') !== 'production', // Auto-create tables in dev
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
