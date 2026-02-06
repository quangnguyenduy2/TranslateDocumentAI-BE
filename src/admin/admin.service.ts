import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DefaultGlossary } from '../database/entities/default-glossary.entity';
import { DefaultBlacklist } from '../database/entities/default-blacklist.entity';
import { User } from '../database/entities/user.entity';
import { CreateDefaultGlossaryDto, UpdateDefaultGlossaryDto } from './dto/default-glossary.dto';
import { CreateDefaultBlacklistDto, UpdateDefaultBlacklistDto } from './dto/default-blacklist.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(DefaultGlossary)
    private defaultGlossaryRepository: Repository<DefaultGlossary>,
    @InjectRepository(DefaultBlacklist)
    private defaultBlacklistRepository: Repository<DefaultBlacklist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ===== DEFAULT GLOSSARY =====
  async getDefaultGlossary(): Promise<DefaultGlossary[]> {
    return this.defaultGlossaryRepository.find({ order: { createdAt: 'DESC' } });
  }

  async addDefaultGlossary(dto: CreateDefaultGlossaryDto): Promise<DefaultGlossary> {
    const item = this.defaultGlossaryRepository.create(dto);
    return this.defaultGlossaryRepository.save(item);
  }

  async updateDefaultGlossary(id: string, dto: UpdateDefaultGlossaryDto): Promise<DefaultGlossary> {
    const item = await this.defaultGlossaryRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Default glossary item not found');
    
    Object.assign(item, dto);
    return this.defaultGlossaryRepository.save(item);
  }

  async deleteDefaultGlossary(id: string): Promise<void> {
    const result = await this.defaultGlossaryRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Default glossary item not found');
  }

  // ===== DEFAULT BLACKLIST =====
  async getDefaultBlacklist(): Promise<DefaultBlacklist[]> {
    return this.defaultBlacklistRepository.find({ order: { createdAt: 'DESC' } });
  }

  async addDefaultBlacklist(dto: CreateDefaultBlacklistDto): Promise<DefaultBlacklist> {
    const item = this.defaultBlacklistRepository.create(dto);
    return this.defaultBlacklistRepository.save(item);
  }

  async updateDefaultBlacklist(id: string, dto: UpdateDefaultBlacklistDto): Promise<DefaultBlacklist> {
    const item = await this.defaultBlacklistRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Default blacklist item not found');
    
    Object.assign(item, dto);
    return this.defaultBlacklistRepository.save(item);
  }

  async deleteDefaultBlacklist(id: string): Promise<void> {
    const result = await this.defaultBlacklistRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Default blacklist item not found');
  }

  // ===== USER MANAGEMENT =====
  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ 
      relations: ['role'],
      order: { createdAt: 'DESC' }
    });
  }

  async changeUserRole(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) throw new NotFoundException('User not found');
    
    user.roleId = roleId;
    return this.userRepository.save(user);
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) throw new NotFoundException('User not found');
    
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }
}
