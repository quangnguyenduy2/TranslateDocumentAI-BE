import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateDefaultGlossaryDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDefaultGlossaryDto {
  @IsString()
  @IsOptional()
  term?: string;

  @IsString()
  @IsOptional()
  translation?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
