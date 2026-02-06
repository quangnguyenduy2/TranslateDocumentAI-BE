import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateDefaultGlossaryDto, UpdateDefaultGlossaryDto } from './dto/default-glossary.dto';
import { CreateDefaultBlacklistDto, UpdateDefaultBlacklistDto } from './dto/default-blacklist.dto';
import { ChangeUserRoleDto } from './dto/user-management.dto';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== DEFAULT GLOSSARY =====
  @Get('default-glossary')
  async getDefaultGlossary() {
    return this.adminService.getDefaultGlossary();
  }

  @Post('default-glossary')
  async addDefaultGlossary(@Body() dto: CreateDefaultGlossaryDto) {
    return this.adminService.addDefaultGlossary(dto);
  }

  @Put('default-glossary/:id')
  async updateDefaultGlossary(@Param('id') id: string, @Body() dto: UpdateDefaultGlossaryDto) {
    return this.adminService.updateDefaultGlossary(id, dto);
  }

  @Delete('default-glossary/:id')
  async deleteDefaultGlossary(@Param('id') id: string) {
    await this.adminService.deleteDefaultGlossary(id);
    return { message: 'Deleted successfully' };
  }

  // ===== DEFAULT BLACKLIST =====
  @Get('default-blacklist')
  async getDefaultBlacklist() {
    return this.adminService.getDefaultBlacklist();
  }

  @Post('default-blacklist')
  async addDefaultBlacklist(@Body() dto: CreateDefaultBlacklistDto) {
    return this.adminService.addDefaultBlacklist(dto);
  }

  @Put('default-blacklist/:id')
  async updateDefaultBlacklist(@Param('id') id: string, @Body() dto: UpdateDefaultBlacklistDto) {
    return this.adminService.updateDefaultBlacklist(id, dto);
  }

  @Delete('default-blacklist/:id')
  async deleteDefaultBlacklist(@Param('id') id: string) {
    await this.adminService.deleteDefaultBlacklist(id);
    return { message: 'Deleted successfully' };
  }

  // ===== USER MANAGEMENT =====
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('users/:id/role')
  async changeUserRole(@Param('id') id: string, @Body() dto: ChangeUserRoleDto) {
    return this.adminService.changeUserRole(id, dto.roleId);
  }

  @Put('users/:id/toggle-status')
  async toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }
}
