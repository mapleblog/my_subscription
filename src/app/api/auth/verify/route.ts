import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
  token: z.string().min(10),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || '';
    const { token: vt } = querySchema.parse({ token });

    const now = new Date();
    // Prefer model API; fallback to raw if model is missing in client
    const record = prisma.emailVerification?.findUnique
      ? await prisma.emailVerification.findUnique({ where: { token: vt } })
      : await prisma.$queryRaw<
          { id: string; userId: string; token: string; expiresAt: Date; usedAt: Date | null }[]
        >(Prisma.sql`SELECT id,"userId",token,"expiresAt","usedAt" FROM "EmailVerification" WHERE token = ${vt} LIMIT 1`).then(r => r[0] || null);
    if (!record) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 });
    }
    if (record.usedAt) {
      return NextResponse.json({ success: false, error: 'Token already used' }, { status: 400 });
    }
    if (record.expiresAt <= now) {
      return NextResponse.json({ success: false, error: 'Token expired' }, { status: 400 });
    }

    // Transactional updates; raw fallback if needed
    // Detect presence of model mappers defensively
    const prismaModels = prisma as unknown as Record<string, unknown>;
    const hasModelAPI = Boolean(prismaModels.emailVerification) && Boolean(prismaModels.user);
    if (hasModelAPI) {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: record.userId }, data: { isVerified: true } });
        await tx.emailVerification.update({ where: { id: record.id }, data: { usedAt: now } });
        await tx.emailVerification.updateMany({
          where: { userId: record.userId, usedAt: null, token: { not: vt } },
          data: { usedAt: now },
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw(Prisma.sql`UPDATE "User" SET "isVerified"=true WHERE id=${record.userId}`);
        await tx.$executeRaw(Prisma.sql`UPDATE "EmailVerification" SET "usedAt"=${now} WHERE id=${record.id}`);
        await tx.$executeRaw(
          Prisma.sql`UPDATE "EmailVerification" SET "usedAt"=${now} WHERE "userId"=${record.userId} AND "usedAt" IS NULL AND token <> ${vt}`
        );
      });
    }

    logger.info('EMAIL_VERIFY_SUCCESS', 'Email verified', { userId: record.userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('EMAIL_VERIFY_ERROR', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
