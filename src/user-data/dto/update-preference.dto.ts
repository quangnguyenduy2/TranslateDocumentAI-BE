import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferenceDto {
  @IsString()
  @IsOptional()
  context?: string;

  @IsBoolean()
  @IsOptional()
  blacklistEnabled?: boolean;
}
