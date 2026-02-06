import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGlossaryDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsNotEmpty()
  translation: string;
}
