import { IsString } from 'class-validator';

export class UpdateApiKeyDto {
  @IsString()
  apiKey: string;
}
