import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class ChangeUserRoleDto {
  @IsUUID()
  roleId: string;
}

export class ToggleUserStatusDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
