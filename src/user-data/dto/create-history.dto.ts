import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateHistoryDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsString()
  @IsNotEmpty()
  targetLang: string;

  @IsNumber()
  timestamp: number;
}
