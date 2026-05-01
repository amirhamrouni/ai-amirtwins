/**
 * GemeenteGPT Local — Token Manager
 * Counts tokens with tiktoken, manages daily limits, summarizes long texts
 */

import { createHash } from 'crypto';
import { prisma } from './prisma';

// Rough token estimation (tiktoken is heavy, use for accuracy)
export function estimateTokens(text: string): number {
  // ~4 chars per token for Arabic, ~3.5 for English
  return Math.ceil(text.length / 3.8);
}

/**
 * Count tokens using tiktoken (cl100k_base encoding, compatible with GPT-4/Kimi)
 * Falls back to estimation if tiktoken fails
 */
export async function countTokens(text: string): Promise<number> {
  try {
    const { encoding_for_model } = await import('tiktoken');
    const enc = encoding_for_model('gpt-4');
    const tokens = enc.encode(text);
    enc.free();
    return tokens.length;
  } catch {
    return estimateTokens(text);
  }
}

/**
 * Check if user has tokens remaining today
 */
export async function checkUserTokens(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
  const limit = config?.tokenDailyLimit ?? parseInt(process.env.TOKEN_DAILY_LIMIT ?? '10000');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { allowed: false, used: 0, limit, remaining: 0 };

  // Reset daily counter if new day
  const lastReset = new Date(user.lastReset);
  const now = new Date();
  if (lastReset.toDateString() !== now.toDateString()) {
    await prisma.user.update({
      where: { id: userId },
      data: { tokenUsedToday: 0, lastReset: now },
    });
    return { allowed: true, used: 0, limit, remaining: limit };
  }

  const used = user.tokenUsedToday;
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, used, limit, remaining };
}

/**
 * Add tokens used to user's daily counter
 */
export async function addTokensUsed(userId: string, tokens: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenUsedToday: { increment: tokens } },
  });
}

/**
 * Summarize text if too long (> 1000 tokens)
 * Returns original if summaryLevel = 'off' or text is short
 */
export async function summarizeIfNeeded(
  text: string,
  summaryLevel: 'aggressive' | 'normal' | 'off' = 'normal'
): Promise<{ text: string; summarized: boolean; tokensUsed: number }> {
  if (summaryLevel === 'off') {
    return { text, summarized: false, tokensUsed: 0 };
  }

  const tokenCount = await countTokens(text);
  const threshold = summaryLevel === 'aggressive' ? 500 : 1000;

  if (tokenCount <= threshold) {
    return { text, summarized: false, tokensUsed: 0 };
  }

  // Import callKimi here to avoid circular deps
  const { callKimiRaw } = await import('./kimi');
  const maxSummaryTokens = summaryLevel === 'aggressive' ? 120 : 300;

  const prompt = `لخص النص التالي بحد أقصى ${maxSummaryTokens} توكن. احتفظ بـ: الأسماء، التواريخ، الأرقام، المواعيد النهائية، أرقام BSN، أرقام قضايا IND. أرجع JSON فقط.\n\n${text.slice(0, 4000)}`;

  const result = await callKimiRaw([
    { role: 'user', content: prompt }
  ], maxSummaryTokens + 50);

  return {
    text: result.content,
    summarized: true,
    tokensUsed: result.tokensUsed,
  };
}

/**
 * Hash text for cache key
 */
export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
