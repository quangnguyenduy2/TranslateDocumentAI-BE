import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class GlossaryItemDto {
  @IsString()
  term: string;

  @IsString()
  translation: string;
}

class BlacklistItemDto {
  @IsString()
  term: string;
}

export class TranslateBatchDto {
  @IsArray()
  @IsString({ each: true })
  texts: string[];

  @IsString()
  targetLang: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlossaryItemDto)
  @IsOptional()
  glossary?: GlossaryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlacklistItemDto)
  @IsOptional()
  blacklist?: BlacklistItemDto[];

  @IsString()
  @IsOptional()
  sourceLang?: string;
}
