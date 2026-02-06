import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlossaryItem } from '../database/entities/glossary-item.entity';
import { BlacklistItem } from '../database/entities/blacklist-item.entity';
import { TranslationHistory } from '../database/entities/translation-history.entity';
import { UserPreference } from '../database/entities/user-preference.entity';
import { DefaultGlossary } from '../database/entities/default-glossary.entity';
import { DefaultBlacklist } from '../database/entities/default-blacklist.entity';
import { CreateGlossaryDto } from './dto/create-glossary.dto';
import { CreateBlacklistDto } from './dto/create-blacklist.dto';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class UserDataService {
  constructor(
    @InjectRepository(GlossaryItem)
    private glossaryRepo: Repository<GlossaryItem>,
    @InjectRepository(BlacklistItem)
    private blacklistRepo: Repository<BlacklistItem>,
    @InjectRepository(TranslationHistory)
    private historyRepo: Repository<TranslationHistory>,
    @InjectRepository(UserPreference)
    private preferenceRepo: Repository<UserPreference>,
    @InjectRepository(DefaultGlossary)
    private defaultGlossaryRepo: Repository<DefaultGlossary>,
    @InjectRepository(DefaultBlacklist)
    private defaultBlacklistRepo: Repository<DefaultBlacklist>,
  ) {}

  // Glossary Methods
  async getGlossary(userId: string): Promise<any[]> {
    // Get default glossary (applies to all users)
    const defaultItems = await this.defaultGlossaryRepo.find({ 
      where: { isActive: true },
      order: { createdAt: 'ASC' }
    });
    
    // Get user's personal glossary
    const userItems = await this.glossaryRepo.find({ 
      where: { userId }, 
      order: { createdAt: 'DESC' } 
    });
    
    // Merge: default items first, then user's items (user can override defaults)
    const merged = [
      ...defaultItems.map(d => ({ 
        id: d.id, 
        term: d.term, 
        translation: d.translation,
        isDefault: true 
      })),
      ...userItems.map(u => ({ 
        id: u.id, 
        term: u.term, 
        translation: u.translation,
        isDefault: false 
      }))
    ];
    
    return merged;
  }

  async saveGlossary(userId: string, items: CreateGlossaryDto[]): Promise<GlossaryItem[]> {
    await this.glossaryRepo.delete({ userId });
    const newItems = items.map(item => this.glossaryRepo.create({ ...item, userId }));
    return this.glossaryRepo.save(newItems);
  }

  async addGlossaryItem(userId: string, dto: CreateGlossaryDto): Promise<GlossaryItem> {
    const item = this.glossaryRepo.create({ ...dto, userId });
    return this.glossaryRepo.save(item);
  }

  async deleteGlossaryItem(userId: string, id: string): Promise<void> {
    await this.glossaryRepo.delete({ id, userId });
  }

  // Blacklist Methods
  async getBlacklist(userId: string): Promise<any[]> {
    // Get default blacklist (applies to all users)
    const defaultItems = await this.defaultBlacklistRepo.find({ 
      where: { isActive: true },
      order: { createdAt: 'ASC' }
    });
    
    // Get user's personal blacklist
    const userItems = await this.blacklistRepo.find({ 
      where: { userId }, 
      order: { createdAt: 'DESC' } 
    });
    
    // Merge: default items first, then user's items
    const merged = [
      ...defaultItems.map(d => ({ 
        id: d.id, 
        term: d.term, 
        caseSensitive: d.caseSensitive,
        enabled: true,
        isDefault: true 
      })),
      ...userItems.map(u => ({ 
        id: u.id, 
        term: u.term, 
        caseSensitive: u.caseSensitive,
        enabled: u.enabled,
        isDefault: false 
      }))
    ];
    
    return merged;
  }

  async saveBlacklist(userId: string, items: CreateBlacklistDto[]): Promise<BlacklistItem[]> {
    await this.blacklistRepo.delete({ userId });
    const newItems = items.map(item => this.blacklistRepo.create({ ...item, userId }));
    return this.blacklistRepo.save(newItems);
  }

  async addBlacklistItem(userId: string, dto: CreateBlacklistDto): Promise<BlacklistItem> {
    const item = this.blacklistRepo.create({ ...dto, userId });
    return this.blacklistRepo.save(item);
  }

  async deleteBlacklistItem(userId: string, id: string): Promise<void> {
    await this.blacklistRepo.delete({ id, userId });
  }

  // History Methods
  async getHistory(userId: string, limit: number = 50): Promise<TranslationHistory[]> {
    return this.historyRepo.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async addHistoryItem(userId: string, dto: CreateHistoryDto): Promise<TranslationHistory> {
    const item = this.historyRepo.create({ ...dto, userId });
    return this.historyRepo.save(item);
  }

  async deleteHistoryItem(userId: string, id: string): Promise<void> {
    await this.historyRepo.delete({ id, userId });
  }

  async clearHistory(userId: string): Promise<void> {
    await this.historyRepo.delete({ userId });
  }

  // Preference Methods
  async getPreference(userId: string): Promise<UserPreference> {
    let preference = await this.preferenceRepo.findOne({ where: { userId } });
    
    if (!preference) {
      preference = this.preferenceRepo.create({ userId, context: '', blacklistEnabled: true });
      preference = await this.preferenceRepo.save(preference);
    }
    
    return preference;
  }

  async updatePreference(userId: string, dto: UpdatePreferenceDto): Promise<UserPreference> {
    let preference = await this.preferenceRepo.findOne({ where: { userId } });
    
    if (!preference) {
      preference = this.preferenceRepo.create({ userId, ...dto });
    } else {
      Object.assign(preference, dto);
    }
    
    return this.preferenceRepo.save(preference);
  }
}
