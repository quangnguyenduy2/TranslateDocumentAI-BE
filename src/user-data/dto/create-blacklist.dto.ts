import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateBlacklistDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsBoolean()
  @IsOptional()
  caseSensitive?: boolean;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
