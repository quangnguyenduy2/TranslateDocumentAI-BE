import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { UserDataService } from './user-data.service';
import { CreateGlossaryDto } from './dto/create-glossary.dto';
import { CreateBlacklistDto } from './dto/create-blacklist.dto';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { BulkGlossaryDto } from './dto/bulk-glossary.dto';
import { BulkBlacklistDto } from './dto/bulk-blacklist.dto';

@Controller('user-data')
@UseGuards(JwtAuthGuard)
export class UserDataController {
  constructor(private readonly userDataService: UserDataService) {}

  @Get('glossary')
  async getGlossary(@CurrentUser() user: User) {
    return this.userDataService.getGlossary(user.id);
  }

  @Post('glossary')
  async addGlossaryItem(@CurrentUser() user: User, @Body() dto: CreateGlossaryDto) {
    return this.userDataService.addGlossaryItem(user.id, dto);
  }

  @Put('glossary')
  async saveGlossary(@CurrentUser() user: User, @Body() dto: BulkGlossaryDto) {
    return this.userDataService.saveGlossary(user.id, dto.items);
  }

  @Delete('glossary/:id')
  async deleteGlossaryItem(@CurrentUser() user: User, @Param('id') id: string) {
    await this.userDataService.deleteGlossaryItem(user.id, id);
    return { message: 'Glossary item deleted' };
  }

  @Get('blacklist')
  async getBlacklist(@CurrentUser() user: User) {
    return this.userDataService.getBlacklist(user.id);
  }

  @Post('blacklist')
  async addBlacklistItem(@CurrentUser() user: User, @Body() dto: CreateBlacklistDto) {
    return this.userDataService.addBlacklistItem(user.id, dto);
  }

  @Put('blacklist')
  async saveBlacklist(@CurrentUser() user: User, @Body() dto: BulkBlacklistDto) {
    return this.userDataService.saveBlacklist(user.id, dto.items);
  }

  @Delete('blacklist/:id')
  async deleteBlacklistItem(@CurrentUser() user: User, @Param('id') id: string) {
    await this.userDataService.deleteBlacklistItem(user.id, id);
    return { message: 'Blacklist item deleted' };
  }

  @Get('history')
  async getHistory(@CurrentUser() user: User) {
    return this.userDataService.getHistory(user.id);
  }

  @Post('history')
  async addHistoryItem(@CurrentUser() user: User, @Body() dto: CreateHistoryDto) {
    return this.userDataService.addHistoryItem(user.id, dto);
  }

  @Delete('history/:id')
  async deleteHistoryItem(@CurrentUser() user: User, @Param('id') id: string) {
    await this.userDataService.deleteHistoryItem(user.id, id);
    return { message: 'History item deleted' };
  }

  @Delete('history')
  async clearHistory(@CurrentUser() user: User) {
    await this.userDataService.clearHistory(user.id);
    return { message: 'History cleared' };
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: User) {
    return this.userDataService.getPreference(user.id);
  }

  @Put('preferences')
  async updatePreferences(@CurrentUser() user: User, @Body() dto: UpdatePreferenceDto) {
    return this.userDataService.updatePreference(user.id, dto);
  }
}
