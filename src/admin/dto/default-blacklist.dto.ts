import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateDefaultBlacklistDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDefaultBlacklistDto {
  @IsString()
  @IsOptional()
  term?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
