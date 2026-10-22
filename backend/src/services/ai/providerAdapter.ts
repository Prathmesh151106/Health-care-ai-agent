/**
 * services/ai/providerAdapter.ts
 * Provider interface and OpenAI implementation.
 * All provider keys are server-side only; never exposed to the frontend.
 * Other providers can be added here by implementing the ProviderAdapter interface.
 */

import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { ServiceUnavailableError } from '../../utils/errors';

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderAdapter {
  complete(messages: ProviderMessage[], timeoutMs: number): Promise<string>;
}

class OpenAIAdapter implements ProviderAdapter {
  async complete(messages: ProviderMessage[], timeoutMs: number): Promise<string> {
    // Dynamic import to avoid loading the SDK when not needed
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: env.aiProviderApiKey });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await client.chat.completions.create(
        {
          model:       env.aiModel,
          messages,
          max_tokens:  1000,
          temperature: 0.3,
        },
        { signal: controller.signal }
      );
      return response.choices[0]?.message?.content ?? '';
    } catch (err) {
      // Map provider errors to safe, generic messages
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('abort') || message.includes('timeout')) {
        throw new ServiceUnavailableError('AI request timed out. Please try again later.');
      }
      if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
        throw new ServiceUnavailableError('AI service is temporarily busy. Please try again in a moment.');
      }
      if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
        logger.error('AI provider authentication failed – check AI_PROVIDER_API_KEY');
        throw new ServiceUnavailableError('AI service is not available.');
      }
      logger.error('AI provider error', { message });
      throw new ServiceUnavailableError('AI service is temporarily unavailable. Please try again later.');
    } finally {
      clearTimeout(timeout);
    }
  }
}

let adapterInstance: ProviderAdapter | null = null;

export function getProviderAdapter(): ProviderAdapter {
  if (!adapterInstance) {
    adapterInstance = new OpenAIAdapter();
  }
  return adapterInstance;
}

/** For testing: inject a mock adapter */
export function setProviderAdapter(adapter: ProviderAdapter): void {
  adapterInstance = adapter;
}
