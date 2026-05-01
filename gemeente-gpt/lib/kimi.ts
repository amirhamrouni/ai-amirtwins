/**
 * GemeenteGPT Local — Kimi AI Client (Server-side Next.js)
 * Uses openai SDK pointed to https://api.moonshot.ai/v1
 * TOKEN ECONOMY: max_tokens=600 default, 1500 for PDF gen
 * SYSTEM PROMPT: 22 tokens only
 */

import OpenAI from 'openai';
import { prisma } from './prisma';
import { generateCacheKey, getCached, setCached } from './cache';
import { checkUserTokens, addTokensUsed, estimateTokens } from './token-manager';

// ─── System Prompt (22 tokens) ────────────────────────────────────────────────
export const SYSTEM_PROMPT =
  'GemeenteGPT. NL bureaucracy. Reply AR chat, NL forms. JSON when possible. No prose.';

// ─── Kimi Client ──────────────────────────────────────────────────────────────

function getKimiClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.MOONSHOT_API_KEY || '';
  return new OpenAI({
    apiKey: key,
    baseURL: 'https://api.moonshot.ai/v1',
  });
}

// ─── Intent Detection (saves tokens by avoiding full agent pipeline) ──────────

export type Intent = 'greeting' | 'form_filler' | 'doc_reader' | 'scheduler' | 'legal' | 'general';

export function detectIntent(text: string): Intent {
  if (/مرحبا|مرحباً|شكرا|شكراً|أهلا|السلام|كيف حالك/i.test(text)) return 'greeting';
  if (/عبي|نموذج|استمارة|ملأ|اكتب|form|formulier/i.test(text)) return 'form_filler';
  if (/موعد|appointment|afspraak|جدول|حجز/i.test(text)) return 'scheduler';
  if (/استئناف|طعن|رفض|appeal|bezwaar|قانون|حق/i.test(text)) return 'legal';
  if (/وثيقة|ملف|pdf|مستند|document/i.test(text)) return 'doc_reader';
  return 'general';
}

// ─── Static Replies (0 tokens) ────────────────────────────────────────────────

const STATIC_REPLIES: Record<string, string> = {
  greeting: 'مرحباً! أنا GemeenteGPT، مساعدك للتعامل مع الإجراءات الهولندية. كيف يمكنني مساعدتك اليوم؟',
};

// ─── Agent Instructions ───────────────────────────────────────────────────────

function getAgentInstruction(intent: Intent): string {
  switch (intent) {
    case 'form_filler':
      return 'أنت خبير ملء النماذج الهولندية. استخرج البيانات وأرجع JSON منظم للنموذج.';
    case 'scheduler':
      return 'أنت مساعد جدولة المواعيد. اقترح مواعيد وأرجع JSON مع التاريخ والوقت والمكان.';
    case 'legal':
      return 'أنت مستشار قانوني للإجراءات الهولندية. حلل الحالة وأرجع JSON مع الخيارات القانونية.';
    case 'doc_reader':
      return 'أنت قارئ وثائق. لخص المعلومات المهمة: الأسماء، التواريخ، الأرقام، المواعيد النهائية.';
    default:
      return '';
  }
}

// ─── Raw Kimi Call (no token tracking, used internally) ──────────────────────

export async function callKimiRaw(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 600,
  apiKey?: string
): Promise<{ content: string; tokensUsed: number }> {
  const config = await prisma.config.findUnique({ where: { id: 'singleton' } }).catch(() => null);
  const key = apiKey || config?.kimiApiKey || process.env.MOONSHOT_API_KEY || '';

  const client = getKimiClient(key);

  const response = await client.chat.completions.create({
    model: 'kimi-k2',
    messages,
    max_tokens: maxTokens,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content ?? '';
  const tokensUsed = response.usage?.total_tokens ?? estimateTokens(messages.map(m => m.content).join('') + content);

  return { content, tokensUsed };
}

// ─── Main Kimi Call (with token tracking + caching) ──────────────────────────

export interface KimiCallOptions {
  userId: string;
  question: string;
  context?: string;
  fileIds?: string[];
  maxTokens?: number;
  useAgentSwarm?: boolean;
}

export interface KimiCallResult {
  content: string;
  tokensUsed: number;
  cached: boolean;
  agentUsed: string;
  intent: Intent;
}

export async function callKimi(options: KimiCallOptions): Promise<KimiCallResult> {
  const {
    userId,
    question,
    context = '',
    fileIds = [],
    maxTokens = 600,
    useAgentSwarm = true,
  } = options;

  // ── Token limit check ──
  const tokenCheck = await checkUserTokens(userId);
  if (!tokenCheck.allowed) {
    throw new Error('TOKEN_LIMIT_EXCEEDED');
  }

  // ── Intent detection ──
  const intent = detectIntent(question);

  // ── Static reply (0 tokens) ──
  if (intent === 'greeting') {
    return {
      content: STATIC_REPLIES.greeting,
      tokensUsed: 0,
      cached: false,
      agentUsed: 'static',
      intent,
    };
  }

  // ── Cache check ──
  const cacheKey = generateCacheKey(userId, question, fileIds);
  const cached = getCached(cacheKey);
  if (cached) {
    // Log cache hit
    await prisma.chatLog.create({
      data: {
        userId,
        promptHash: cacheKey,
        responseJson: cached,
        tokens: 0,
        agentUsed: 'cache',
        cached: true,
      },
    }).catch(() => {});

    return {
      content: cached,
      tokensUsed: 0,
      cached: true,
      agentUsed: 'cache',
      intent,
    };
  }

  // ── Build messages ──
  const agentInstruction = useAgentSwarm ? getAgentInstruction(intent) : '';
  const systemContent = SYSTEM_PROMPT + (agentInstruction ? '\n' + agentInstruction : '');

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemContent },
  ];

  if (context) {
    messages.push({ role: 'user', content: `السياق:\n${context}` });
    messages.push({ role: 'assistant', content: 'فهمت السياق.' });
  }

  messages.push({ role: 'user', content: question });

  // ── API call ──
  const result = await callKimiRaw(messages, maxTokens);

  // ── Update token counter ──
  await addTokensUsed(userId, result.tokensUsed);

  // ── Cache result ──
  setCached(cacheKey, result.content);

  // ── Log to DB ──
  await prisma.chatLog.create({
    data: {
      userId,
      promptHash: cacheKey,
      responseJson: result.content,
      tokens: result.tokensUsed,
      agentUsed: useAgentSwarm ? intent : 'instant',
      cached: false,
    },
  }).catch(() => {});

  return {
    content: result.content,
    tokensUsed: result.tokensUsed,
    cached: false,
    agentUsed: useAgentSwarm ? intent : 'instant',
    intent,
  };
}

// ─── PDF Summarization ────────────────────────────────────────────────────────

export async function summarizePDFText(
  text: string,
  summaryLevel: 'aggressive' | 'normal' | 'off' = 'normal',
  apiKey?: string
): Promise<{ summary: string; tokensUsed: number }> {
  if (summaryLevel === 'off') {
    return { summary: text.slice(0, 500), tokensUsed: 0 };
  }

  const maxTokens = summaryLevel === 'aggressive' ? 100 : 150;
  const prompt = `استخرج: الأسماء، التواريخ، أرقام BSN، أرقام قضايا IND، المواعيد النهائية. بحد أقصى ${maxTokens} توكن. أرجع JSON فقط.\n\n${text.slice(0, 3000)}`;

  const result = await callKimiRaw(
    [{ role: 'user', content: prompt }],
    maxTokens + 50,
    apiKey
  );

  return { summary: result.content, tokensUsed: result.tokensUsed };
}
