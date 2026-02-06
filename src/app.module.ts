import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TranslationModule } from './translation/translation.module';
import { TasksModule } from './tasks/tasks.module';
import { UserDataModule } from './user-data/user-data.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute for auth endpoints
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100, // 100 requests per minute for translation
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    TranslationModule,
    TasksModule,
    UserDataModule,
    AdminModule,
  ],
})
export class AppModule {}
