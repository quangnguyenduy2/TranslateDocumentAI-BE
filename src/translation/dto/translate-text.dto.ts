import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
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

export class TranslateTextDto {
  @IsString()
  text: string;

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
