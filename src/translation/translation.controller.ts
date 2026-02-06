import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { TranslationService } from './translation.service';
import { TranslateTextDto } from './dto/translate-text.dto';
import { TranslateBatchDto } from './dto/translate-batch.dto';

@Controller('translate')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@Throttle({ long: { limit: 100, ttl: 60000 } }) // 100 requests per minute
export class TranslationController {
  constructor(private translationService: TranslationService) {}

  @Post('text')
  async translateText(@Body() dto: TranslateTextDto, @CurrentUser() user: User) {
    const result = await this.translationService.translateText(dto, user.id);
    return { translatedText: result };
  }

  @Post('batch')
  async translateBatch(@Body() dto: TranslateBatchDto, @CurrentUser() user: User) {
    const results = await this.translationService.translateBatch(dto, user.id);
    return { translations: results };
  }

  @Post('extract-text')
  async extractText(@Body() body: { base64Data: string; mimeType: string }, @CurrentUser() user: User) {
    const text = await this.translationService.extractTextFromBase64(body.base64Data, body.mimeType, user.id);
    return { extractedText: text };
  }
}
