/**
 * Issue Session Links API - Link sessions to issues
 * @see specs/SCHEMA.md:L314-319
 *
 * POST   /api/issues/[id]/sessions - Link a session to an issue
 * GET    /api/issues/[id]/sessions - List all session links for an issue
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { LinkSessionSchema } from '@/contract/pm/schemas';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/issues/[id]/sessions
 * Link an OpenCode session to an issue.
 * @see specs/SCHEMA.md:L318
 *
 * Request body: { sessionId: string, linkType?: string | null }
 * Response: { success: true, data: { linked: true, issueId: string, sessionId: string } }
 * Errors: 400 for validation, 404 if issue not found, 500 for internal errors
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid JSON body', code: 'PARSE_ERROR' },
        },
        { status: 400 }
      );
    }

    const result = LinkSessionSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            message: firstError?.message ?? 'Validation failed',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    const { sessionId, linkType } = result.data;

    const existingLinks = repo.getSessionLinks(id);
    const alreadyLinked = existingLinks.some((link) => link.sessionId === sessionId);
    if (alreadyLinked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Session "${sessionId}" is already linked to issue "${id}"`,
            code: 'ALREADY_LINKED',
          },
        },
        { status: 400 }
      );
    }

    repo.linkSession(id, sessionId, linkType);

    return NextResponse.json({
      success: true,
      data: {
        linked: true,
        issueId: id,
        sessionId,
      },
    });
  } catch (error) {
    logger.error('POST /api/issues/[id]/sessions failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to link session', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/issues/[id]/sessions
 * List all session links for an issue.
 *
 * Response: { success: true, data: IssueSession[] }
 * Errors: 404 if issue not found, 500 for internal errors
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
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

    const sessionLinks = repo.getSessionLinks(id);

    return NextResponse.json({
      success: true,
      data: sessionLinks,
    });
  } catch (error) {
    logger.error('GET /api/issues/[id]/sessions failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to get session links', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
