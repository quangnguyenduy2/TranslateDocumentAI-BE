import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBlacklistDto } from './create-blacklist.dto';

export class BulkBlacklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlacklistDto)
  items: CreateBlacklistDto[];
}
