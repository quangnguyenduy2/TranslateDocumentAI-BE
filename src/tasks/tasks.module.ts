import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanupService } from './cleanup.service';
import { Session } from '../database/entities/session.entity';
import { RefreshToken } from '../database/entities/refresh-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, RefreshToken])],
  providers: [CleanupService],
  exports: [CleanupService],
})
export class TasksModule {}
