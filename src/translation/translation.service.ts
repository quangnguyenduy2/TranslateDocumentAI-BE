import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleGenAI, Type } from '@google/genai';
import { UsageLog } from '../database/entities/usage-log.entity';
import { TranslateTextDto } from './dto/translate-text.dto';
import { TranslateBatchDto } from './dto/translate-batch.dto';
import { maskText, unmaskText, maskBatchTexts, unmaskBatchTexts } from '../common/utils/text-protector.util';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private ai: GoogleGenAI;
  private readonly MODEL_FAST = 'gemini-3-flash-preview';

  constructor(
    private configService: ConfigService,
    @InjectRepository(UsageLog)
    private usageLogRepository: Repository<UsageLog>,
  ) {
    const apiKey = this.configService.get('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.logger.log('Translation service initialized successfully');
  }

  /**
   * TODO: Copy all helper functions from frontend geminiService.ts:
   * - filterRelevantGlossary()
   * - buildSystemInstruction()
   * - getLanguageCode()
   * - extractPlaceholders()
   * - restorePlaceholders()
   * - parseApiError()
   * - detectLanguage()
   * 
   * For now, simplified version for demonstration
   */

  private detectLanguage(text: string): string {
    if (!text || text.trim().length === 0) return 'unknown';
    
    const cleanText = text.replace(/<\/?[biusOBIUS]>/g, '').trim();
    
    // Vietnamese: Latin chars + Vietnamese diacritics
    const viPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
    if (viPattern.test(cleanText)) return 'vi';
    
    // Japanese: Hiragana, Katakana, Kanji
    const jaPattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    if (jaPattern.test(cleanText)) return 'ja';
    
    // Korean: Hangul
    const koPattern = /[\uAC00-\uD7AF\u1100-\u11FF]/;
    if (koPattern.test(cleanText)) return 'ko';
    
    // Chinese: CJK Unified Ideographs
    const zhPattern = /[\u4E00-\u9FFF]/;
    if (zhPattern.test(cleanText) && !jaPattern.test(cleanText)) return 'zh';
    
    // English: mostly Latin alphabet
    const enPattern = /^[a-zA-Z0-9\s.,;:!?'"-()\[\]{}@#$%^&*+=/<>|\\~`]+$/;
    if (enPattern.test(cleanText)) return 'en';
    
    return 'unknown';
  }

  private buildSystemInstruction(targetLang: string, context: string, glossary: any[]): string {
    let instruction = `You are a Multimodal Translator Expert. 
1. Translate to ${targetLang}.
2. Preserve formatting/layout.
3. Use professional tone.`;

    if (context?.trim()) instruction += `\nCONTEXT: ${context}`;
    if (glossary && glossary.length > 0) {
      instruction += `\n\nGLOSSARY:\n` + glossary.map(i => `- ${i.term} -> ${i.translation}`).join('\n');
    }
    return instruction;
  }

  async translateText(dto: TranslateTextDto, userId: string): Promise<string> {
    const startTime = Date.now();

    if (!dto.text || !dto.text.trim()) {
      return '';
    }

    try {
      // STEP 1: Mask sensitive data
      const { maskedText, protectionMap } = maskText(dto.text, dto.blacklist || []);

      // STEP 2: Detect source language
      const sourceLang = dto.sourceLang && dto.sourceLang !== 'auto' 
        ? dto.sourceLang 
        : this.detectLanguage(maskedText);

      // STEP 3: Build instruction and translate
      const instruction = this.buildSystemInstruction(dto.targetLang, dto.context || '', dto.glossary || []);
      
      const hasProtection = Object.keys(protectionMap).length > 0;
      const prompt = hasProtection
        ? `${instruction}\n\nTranslate this (keep __PROTECTED_0__, __PROTECTED_1__, etc. as-is):\n${maskedText}`
        : `${instruction}\n\nTranslate this:\n${maskedText}`;

      const response = await this.ai.models.generateContent({
        model: this.MODEL_FAST,
        contents: prompt,
      });

      const translated = response.text?.replace(/^```markdown\s*|```$/g, '') || maskedText;

      // STEP 4: Unmask sensitive data
      const finalTranslation = unmaskText(translated, protectionMap);

      // Log usage
      const tokensUsed = Math.ceil(dto.text.length / 4);
      await this.usageLogRepository.save({
        userId,
        tokensUsed,
        endpoint: '/translate/text',
        sourceLang: sourceLang,
        targetLang: dto.targetLang,
      });

      this.logger.log(`Translation completed in ${Date.now() - startTime}ms for user ${userId}`);

      return finalTranslation;
    } catch (error) {
      this.logger.error(`Translation error: ${error.message}`, error.stack);
      throw new BadRequestException('Translation failed: ' + error.message);
    }
  }

  async translateBatch(dto: TranslateBatchDto, userId: string): Promise<string[]> {
    const startTime = Date.now();

    if (!dto.texts || dto.texts.length === 0) {
      return [];
    }

    try {
      // STEP 1: Mask all texts
      const { maskedTexts, protectionMap: globalProtectionMap } = maskBatchTexts(dto.texts, dto.blacklist || []);

      // STEP 2: Detect source language
      const firstText = maskedTexts.find(t => t.trim().length > 0) || '';
      const sourceLang = dto.sourceLang && dto.sourceLang !== 'auto'
        ? dto.sourceLang
        : this.detectLanguage(firstText);

      // STEP 3: Build instruction and translate
      const instruction = this.buildSystemInstruction(dto.targetLang, dto.context || '', dto.glossary || []);
      
      const hasProtection = Object.keys(globalProtectionMap).length > 0;
      const prompt = hasProtection
        ? `${instruction}\n\nTranslate this JSON array. Keep __PROTECTED_0__, __PROTECTED_1__ placeholders as-is. Maintain order.`
        : `${instruction}\n\nTranslate this JSON array of strings. Maintain order.`;

      const response = await this.ai.models.generateContent({
        model: this.MODEL_FAST,
        contents: { parts: [{ text: prompt }, { text: JSON.stringify(maskedTexts) }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: { translations: { type: Type.ARRAY, items: { type: Type.STRING } } }
          }
        }
      });

      const translations = JSON.parse(response.text || '{}').translations;

      if (!translations || !Array.isArray(translations) || translations.length !== dto.texts.length) {
        throw new Error('Invalid translation response format');
      }

      // STEP 4: Unmask sensitive data
      const finalTranslations = unmaskBatchTexts(translations, globalProtectionMap);

      // Log usage
      const tokensUsed = dto.texts.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0);
      await this.usageLogRepository.save({
        userId,
        tokensUsed,
        endpoint: '/translate/batch',
        sourceLang: sourceLang,
        targetLang: dto.targetLang,
      });

      this.logger.log(`Batch translation completed in ${Date.now() - startTime}ms for user ${userId}`);

      return finalTranslations;
    } catch (error) {
      this.logger.error(`Batch translation error: ${error.message}`, error.stack);
      throw new BadRequestException('Batch translation failed: ' + error.message);
    }
  }

  async extractTextFromBase64(base64Data: string, mimeType: string, userId: string): Promise<string> {
    const prompt = `OCR expert: Extract ALL text as Markdown. Preserve layout. Do not translate.`;
    try {
      const response = await this.ai.models.generateContent({
        model: this.MODEL_FAST,
        contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] }
      });
      
      const extractedText = response.text?.replace(/^```markdown\s*|```$/g, '') || '';

      // Log usage
      await this.usageLogRepository.save({
        userId,
        tokensUsed: 100, // Rough estimate for OCR
        endpoint: '/translate/extract-text',
        sourceLang: 'image',
        targetLang: 'text',
      });

      return extractedText;
    } catch (error) {
      this.logger.error(`OCR error: ${error.message}`, error.stack);
      return '';
    }
  }
}
