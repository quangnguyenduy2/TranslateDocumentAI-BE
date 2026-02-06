import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGlossaryDto } from './create-glossary.dto';

export class BulkGlossaryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGlossaryDto)
  items: CreateGlossaryDto[];
}
