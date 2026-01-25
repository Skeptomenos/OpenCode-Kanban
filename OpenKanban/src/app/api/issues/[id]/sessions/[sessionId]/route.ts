/**
 * Session Unlink API - Remove session link from issue
 * @see specs/SCHEMA.md:L319
 *
 * DELETE /api/issues/[id]/sessions/[sessionId] - Unlink a session from an issue
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';

type RouteContext = {
  params: Promise<{ id: string; sessionId: string }>;
};

/**
 * DELETE /api/issues/[id]/sessions/[sessionId]
 * Unlink an OpenCode session from an issue.
 * @see specs/SCHEMA.md:L319
 *
 * Response: { success: true, data: { unlinked: true, issueId: string, sessionId: string } }
 * Errors: 404 if issue not found, 500 for internal errors
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id, sessionId } = await context.params;
    const db = getDb();
    const repo = new SqlitePMRepository(db);

    const existing = repo.getIssue(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Issue with id "${id}" not found`, code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    repo.unlinkSession(id, sessionId);

    return NextResponse.json({
      success: true,
      data: {
        unlinked: true,
        issueId: id,
        sessionId,
      },
    });
  } catch (error) {
    console.error('DELETE /api/issues/[id]/sessions/[sessionId] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to unlink session', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
