import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlossaryItem } from '../database/entities/glossary-item.entity';
import { BlacklistItem } from '../database/entities/blacklist-item.entity';
import { TranslationHistory } from '../database/entities/translation-history.entity';
import { UserPreference } from '../database/entities/user-preference.entity';
import { DefaultGlossary } from '../database/entities/default-glossary.entity';
import { DefaultBlacklist } from '../database/entities/default-blacklist.entity';
import { UserDataController } from './user-data.controller';
import { UserDataService } from './user-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GlossaryItem,
      BlacklistItem,
      TranslationHistory,
      UserPreference,
      DefaultGlossary,
      DefaultBlacklist,
    ]),
  ],
  controllers: [UserDataController],
  providers: [UserDataService],
  exports: [UserDataService],
})
export class UserDataModule {}
