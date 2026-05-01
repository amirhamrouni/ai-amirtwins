/**
 * GemeenteGPT Local — Upload API Route
 * POST /api/upload
 * 
 * TOKEN ECONOMY:
 * 1. pdf-parse locally = 0 tokens
 * 2. Send extracted text to Kimi summarize = ~200 tokens
 * 3. Save summary to SQLite, discard full text
 * 
 * If LOCAL_OCR_ONLY=true: use tesseract.js for images, 0 tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { summarizePDFText } from '@/lib/kimi';
import { checkUserTokens } from '@/lib/token-manager';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  // ── Auth check ──
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // ── Token check ──
  const tokenCheck = await checkUserTokens(session.user.id);
  if (!tokenCheck.allowed) {
    return NextResponse.json(
      { error: 'خلصت توكن اليوم', remaining: 0 },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'الملف أكبر من 5MB' }, { status: 400 });
    }

    // ── Read file ──
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Extract text ──
    let extractedText = '';
    let tokensUsed = 0;

    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const localOCROnly = process.env.LOCAL_OCR_ONLY === 'true';

    if (isPDF) {
      // Use pdf-parse locally (0 tokens)
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } catch {
        extractedText = `[PDF: ${file.name}]`;
      }
    } else if (isImage && localOCROnly) {
      // Use tesseract.js locally (0 tokens)
      try {
        const Tesseract = await import('tesseract.js');
        const worker = await Tesseract.createWorker(['ara', 'nld', 'eng']);
        const { data } = await worker.recognize(buffer);
        extractedText = data.text;
        await worker.terminate();
      } catch {
        extractedText = `[Image: ${file.name}]`;
      }
    } else {
      // Plain text
      extractedText = buffer.toString('utf-8');
    }

    // ── Get config for summary level ──
    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const summaryLevel = (config?.summaryLevel as 'aggressive' | 'normal' | 'off') ?? 'normal';

    // ── Summarize with Kimi (~200 tokens) ──
    const { summary, tokensUsed: summaryTokens } = await summarizePDFText(
      extractedText,
      summaryLevel,
      config?.kimiApiKey
    );
    tokensUsed = summaryTokens;

    // ── Save file to disk ──
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    // ── Save to DB (summary only, NOT full text) ──
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        summary,
        tokenCount: tokensUsed,
        size: file.size,
      },
    });

    return NextResponse.json({
      fileId: document.id,
      filename: file.name,
      summary,
      tokensUsed,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'فشل في معالجة الملف' }, { status: 500 });
  }
}
