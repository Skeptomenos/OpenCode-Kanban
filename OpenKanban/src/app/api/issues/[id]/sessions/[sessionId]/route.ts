/**
 * Session Unlink API - Remove session link from issue
 * @see specs/SCHEMA.md:L319
 * @see ralph-wiggum/specs/354-service-completion.md:L43-46
 *
 * DELETE /api/issues/[id]/sessions/[sessionId] - Unlink a session from an issue
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { IssueService } from '@/services/issue-service';
import { logger } from '@/lib/logger';

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
    const service = new IssueService(repo);

    const existing = service.getIssue(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Issue with id "${id}" not found`, code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    service.unlinkSession(id, sessionId);

    return NextResponse.json({
      success: true,
      data: {
        unlinked: true,
        issueId: id,
        sessionId,
      },
    });
  } catch (error) {
    logger.error('DELETE /api/issues/[id]/sessions/[sessionId] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to unlink session', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
