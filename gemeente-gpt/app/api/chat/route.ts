/**
 * GemeenteGPT Local — Chat API Route
 * POST /api/chat
 * 
 * TOKEN ECONOMY:
 * - Check cache first (0 tokens if hit)
 * - Detect intent (lazy load agents)
 * - Use only summaries from DB (not full text)
 * - max_tokens=600 default
 * - Block if user > 10k tokens/day
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callKimi } from '@/lib/kimi';
import { checkUserTokens } from '@/lib/token-manager';

export async function POST(req: NextRequest) {
  // ── Auth check ──
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // ── Token limit check (middleware also checks, but double-check here) ──
  const tokenCheck = await checkUserTokens(session.user.id);
  if (!tokenCheck.allowed) {
    return NextResponse.json(
      {
        error: 'خلصت توكن اليوم',
        message: 'لقد استنفدت حد التوكن اليومي. يمكنك رفع الحد في الإعدادات أو الانتظار حتى الغد.',
        used: tokenCheck.used,
        limit: tokenCheck.limit,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { question, fileIds = [], sessionId } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: 'السؤال مطلوب' }, { status: 400 });
    }

    // ── Get config ──
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const useAgentSwarm = config?.enableAgentSwarm ?? true;

    // ── Build context from document summaries (NOT full text) ──
    let context = '';
    if (fileIds.length > 0) {
      const documents = await prisma.document.findMany({
        where: {
          id: { in: fileIds },
          userId: session.user.id,
        },
        select: { filename: true, summary: true },
      });
      context = documents
        .map(d => `[${d.filename}]: ${d.summary}`)
        .join('\n\n');
    }

    // ── Call Kimi with full token economy ──
    const result = await callKimi({
      userId: session.user.id,
      question: question.trim(),
      context,
      fileIds,
      maxTokens: 600,
      useAgentSwarm,
    });

    // ── Get updated token stats ──
    const updatedTokenCheck = await checkUserTokens(session.user.id);

    return NextResponse.json({
      content: result.content,
      tokensUsed: result.tokensUsed,
      cached: result.cached,
      agentUsed: result.agentUsed,
      intent: result.intent,
      tokenStats: {
        used: updatedTokenCheck.used,
        limit: updatedTokenCheck.limit,
        remaining: updatedTokenCheck.remaining,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'TOKEN_LIMIT_EXCEEDED') {
      return NextResponse.json(
        { error: 'خلصت توكن اليوم' },
        { status: 429 }
      );
    }
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 });
  }
}

// ── GET: Token stats for current user ──
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const tokenCheck = await checkUserTokens(session.user.id);
  return NextResponse.json(tokenCheck);
}
