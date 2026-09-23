import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as FormData from 'form-data';
import { ERR_TRANSCRIPT } from '../commons/errors/errors-codes';
// import { Configuration, OpenAIApi } from 'openai';
import { AppError } from '../commons/errors/app-error';
import axios from 'axios';
import { isEmpty, last } from 'lodash';
// import { ChatCompletionRequestMessage } from 'openai/api';
import { CreateChatAIDto } from './dto/create-chat-a-i.dto';
import { interpolateVariables } from '../commons/utils';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/src/resources/messages';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

abstract class IAiService {
  abstract speechToText(fileBuffer, fileName: string): Promise<string>;

  abstract textSummary(text: string): Promise<string>;

  abstract createChatCompletion(content: string): Promise<string>;
}

export enum AIModel {
  //  Input  $0.00015 / 1K tokens    Output $0.00060 / 1K tokens
  GPT_4O_MINI = 'gpt-4o-mini',

  //  Input  $0.00100 / 1K tokens    Output $0.00500 / 1K tokens
  GPT_4_1_MINI = 'gpt-4.1-mini',

  //  Input  $0.00500 / 1K tokens    Output $0.01500 / 1K tokens
  GPT_4_1 = 'gpt-4.1',

  //  Input  $0.00100 / 1K tokens    Output $0.00500 / 1K tokens
  GPT_4_1_PREVIEW = 'gpt-4.1-preview',

  //  Input  $0.00500 / 1K tokens    Output $0.01500 / 1K tokens
  GPT4O = 'gpt-4o',

  //  Input  $0.00006 / 1K tokens    Output $0.00018 / 1K tokens
  GPT_4O_MINI_TRANSCRIBE = 'gpt-4o-mini-transcribe',

  //  Input  $0.0006 / 1K tokens     Output $0.0018 / 1K tokens
  GPT_4O_TRANSCRIBE = 'gpt-4o-transcribe',

  // 	Input	$0.03 / 1K tokens	output $0.06 / 1K tokens
  GPT_4 = 'gpt-4',

  // 	Training $0.0080 / 1K tokens Input	$0.0030 / 1K tokens	Output $0.0060 / 1K tokens
  GPT3_5_TURBO = 'gpt-3.5-turbo',
  //  Input  $0.00300 / 1K tokens    Output $0.01500 / 1K tokens
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-latest',

  //  Input  $0.00080 / 1K tokens    Output $0.00400 / 1K tokens
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-latest',
  // 	Input	$15 / 1M tokens	output $75 / 1M tokens
  CLAUDE3_OPUS = 'claude-3-opus-20240229',
  // 	Input	$3 / 1M tokens	output $15 / 1M tokens
  CLAUDE3_SONNET = 'claude-3-sonnet-20240229',
  // 	Input	$0.25 / 1M tokens	output $1.25 / 1M tokens
  CLAUDE3_HAIKU = 'claude-3-haiku-20240307',
}

export enum AIProvider {
  OPEN_AI = 'OPEN_AI',
  CLAUDE_AI = 'CLAUDE_AI',
  GEMINI = 'GEMINI',
}

@Injectable()
export class AiService implements IAiService {
  private readonly _OPENAI_API_KEY: string;
  private readonly _ANTHROPIC_API_KEY: string;
  // private readonly _OPENAI_MODEL = 'gpt-3.5-turbo';
  private readonly _OPENAI_MODEL = AIModel.GPT4O;
  private _OPENAI_BASE_URL = 'https://api.openai.com/v1';
  private readonly MAX_SEGMENT_LENGTH = 30000;

  private readonly _openAi = new OpenAI();

  private readonly _anthropic = new Anthropic();

  constructor(private configService: ConfigService) {
    this._OPENAI_API_KEY = configService.get('OPENAI_API_KEY');
    this._ANTHROPIC_API_KEY = configService.get('ANTHROPIC_API_KEY');
  }

  // REST API
  async speechToText(fileBuffer: ArrayBuffer | Buffer, fileName: string): Promise<string> {
    try {
      const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);

      const form = new FormData();
      form.append('file', buffer, { filename: fileName, contentType: 'application/octet-stream' });
      // form.append('model', 'whisper-1');
      form.append('model', AIModel.GPT_4O_MINI_TRANSCRIBE);

      const headers = {
        ...form.getHeaders(),
        Authorization: `Bearer ${this._OPENAI_API_KEY}`,
      };

      const resp = await axios.post(`${this._OPENAI_BASE_URL}/audio/transcriptions`, form, {
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 120_000,
        proxy: false, // avoids corporate proxy auto-detection issues
      });

      return resp.data?.text ?? '';
    } catch (e: any) {
      console.error('Transcribe error:', e?.response?.status, e?.response?.data || e?.message);
      throw new ServiceUnavailableException(new AppError(ERR_TRANSCRIPT));
    }
  }

  async textSummary(text: string, summaryMaxCharacters?: number) {
    const defaultSummaryMaxCharacters = Math.floor((text.length * 70) / 100);
    const content = `Summary directly all this text with ${
      summaryMaxCharacters ?? defaultSummaryMaxCharacters
    } characters at max: ${text}`;
    console.log(`textSummary content`);
    return this.createChatCompletion(content);
  }

  async createChatCompletion(content: string, dto: CreateChatAIDto = {}): Promise<string> {
    const { inputVariables, outputVariables } = dto;
    let result: string;

    // interpolate variables of input
    if (inputVariables) content = interpolateVariables(content, dto.inputVariables);

    try {
      result = await this._createChatCompletionBySegment(content, dto, null);
    } catch (e) {
      console.log(e);
      result = await this._createChatCompletionSplitBySegments(content, dto);
    }

    // interpolate variables of the AI result
    return outputVariables ? interpolateVariables(result, outputVariables) : result;
  }

  async _createChatCompletionBySegment(segment: string, dto: CreateChatAIDto, context?: string) {
    const { model, maxResponseLength, userId, aiProvider } = dto;

    switch (aiProvider) {
      case AIProvider.OPEN_AI:
        return this._createChatCompletionByOpenAI(segment, dto, context);
      case AIProvider.CLAUDE_AI:
        return this._createChatCompletionByClaudeAI(segment, dto, context);
      default:
        // in case an AI provider got deleted in future you can still use OPEN AI as default provider
        return this._createChatCompletionByOpenAI(segment, dto, context);
    }
  }

  async _createChatCompletionByOpenAI(segment: string, dto: CreateChatAIDto, context?: string) {
    const { model, maxResponseLength, userId, jsonSchema } = dto;

    const messages: Array<ChatCompletionMessageParam> = [{ role: 'user', content: segment }];

    const chatCompletion = await this._openAi.chat.completions.create({
      model: model ?? this._OPENAI_MODEL,
      messages,
      temperature: 0.7,
      top_p: 1,
      max_completion_tokens: maxResponseLength,
      user: userId,
      response_format: jsonSchema
        ? {
            json_schema: {
              schema: jsonSchema,
              name: 'CustomSchema',
            },
            type: 'json_schema',
          }
        : undefined,
    });
    // console.log(chatCompletion);
    const result = chatCompletion.choices[0].message.content;
    return result;
  }

  async _createChatCompletionByClaudeAI(segment: string, dto: CreateChatAIDto, context?: string) {
    const { model, maxResponseLength, userId, jsonSchema } = dto;
    // const assistantPrompt: MessageParam = jsonSchema
    //   ? {
    //       role: 'assistant',
    //       content: `Return ONLY valid JSON. Here is the schema:\n${JSON.stringify(jsonSchema)}`,
    //     }
    //   : null;
    // const userPrompt: MessageParam = { role: 'user', content: segment };
    // const messages: Array<MessageParam> = [userPrompt];
    const messages: Array<MessageParam> = [{ role: 'user', content: segment }];
    const maxTokens = maxResponseLength ?? this._getDefaultMaxTokenByModel(model);

    const result = await this._anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: 1,
      system: jsonSchema ? `Return ONLY valid JSON. Here is the schema:\n${JSON.stringify(jsonSchema)}` : null,

      //system: "Respond only with short poems.",
      messages: messages,
    });

    const text = result.content[0]['text'];
    return text;
  }

  _getDefaultMaxTokenByModel(model: AIModel) {
    switch (model) {
      case AIModel.CLAUDE_3_5_SONNET:
        return 8192;
      case AIModel.CLAUDE3_OPUS:
      case AIModel.CLAUDE3_SONNET:
      case AIModel.CLAUDE3_HAIKU:
        return 4096;
    }
  }

  private async _createChatCompletionSplitBySegments(content: string, dto: CreateChatAIDto): Promise<string> {
    const result: string[] = [];
    const segments = [];
    for (let i = 0; i < content.length; i += this.MAX_SEGMENT_LENGTH) {
      segments.push(content.substring(i, i + this.MAX_SEGMENT_LENGTH));
    }

    for (const segment of segments) {
      // previousSegmentCompletion as context
      const context = isEmpty(result) ? null : last(result);
      const segmentResult = await this._createChatCompletionBySegment(segment, dto, context);
      result.push(segmentResult);
    }
    return result.join('\n');
  }
}
