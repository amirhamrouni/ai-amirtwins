/**
 * GemeenteGPT Local — Settings API Route
 * GET /api/settings — Get current config
 * POST /api/settings — Update config
 * Saves to SQLite Config table (no .env write needed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const config = await prisma.config.findUnique({ where: { id: 'singleton' } });

  if (!config) {
    // Return defaults
    return NextResponse.json({
      kimiApiKey: '',
      tokenDailyLimit: parseInt(process.env.TOKEN_DAILY_LIMIT ?? '10000'),
      enableAgentSwarm: true,
      enableLocalOCR: process.env.LOCAL_OCR_ONLY === 'true',
      summaryLevel: 'normal',
      gemeente: 'Amsterdam',
    });
  }

  // Mask API key for security
  return NextResponse.json({
    ...config,
    kimiApiKey: config.kimiApiKey ? '***' + config.kimiApiKey.slice(-4) : '',
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      kimiApiKey,
      tokenDailyLimit,
      enableAgentSwarm,
      enableLocalOCR,
      summaryLevel,
      gemeente,
    } = body;

    // Validate
    if (tokenDailyLimit && (tokenDailyLimit < 100 || tokenDailyLimit > 100000)) {
      return NextResponse.json({ error: 'حد التوكن يجب أن يكون بين 100 و 100,000' }, { status: 400 });
    }

    if (summaryLevel && !['aggressive', 'normal', 'off'].includes(summaryLevel)) {
      return NextResponse.json({ error: 'مستوى التلخيص غير صحيح' }, { status: 400 });
    }

    // Upsert config
    const existing = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const currentKey = existing?.kimiApiKey ?? '';

    const config = await prisma.config.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        kimiApiKey: kimiApiKey || '',
        tokenDailyLimit: tokenDailyLimit ?? 10000,
        enableAgentSwarm: enableAgentSwarm ?? true,
        enableLocalOCR: enableLocalOCR ?? true,
        summaryLevel: summaryLevel ?? 'normal',
        gemeente: gemeente ?? 'Amsterdam',
      },
      update: {
        // Only update key if new value provided (not masked ***)
        ...(kimiApiKey && !kimiApiKey.startsWith('***') ? { kimiApiKey } : { kimiApiKey: currentKey }),
        ...(tokenDailyLimit !== undefined && { tokenDailyLimit }),
        ...(enableAgentSwarm !== undefined && { enableAgentSwarm }),
        ...(enableLocalOCR !== undefined && { enableLocalOCR }),
        ...(summaryLevel !== undefined && { summaryLevel }),
        ...(gemeente !== undefined && { gemeente }),
      },
    });

    return NextResponse.json({ success: true, config: { ...config, kimiApiKey: '***' } });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'فشل في حفظ الإعدادات' }, { status: 500 });
  }
}

// ── Test API Key ──
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { apiKey } = await req.json();

  try {
    const response = await fetch('https://api.moonshot.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (response.ok) {
      return NextResponse.json({ valid: true, message: 'مفتاح API صحيح ✓' });
    } else {
      return NextResponse.json({ valid: false, message: 'مفتاح API غير صحيح' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ valid: false, message: 'فشل الاتصال' }, { status: 500 });
  }
}
