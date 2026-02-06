import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DefaultGlossary } from '../database/entities/default-glossary.entity';
import { DefaultBlacklist } from '../database/entities/default-blacklist.entity';
import { User } from '../database/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DefaultGlossary, DefaultBlacklist, User]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
