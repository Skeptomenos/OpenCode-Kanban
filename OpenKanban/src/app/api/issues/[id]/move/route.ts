import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { IssueService } from '@/services/issue-service';
import { MoveIssueSchema } from '@/contract/pm/schemas';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
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

    const result = MoveIssueSchema.safeParse(body);
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

    const { status, prevIssueId, nextIssueId } = result.data;
    const movedIssue = service.moveIssue(id, status, prevIssueId, nextIssueId);

    return NextResponse.json({
      success: true,
      data: movedIssue,
    });
  } catch (error) {
    logger.error('PUT /api/issues/[id]/move failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to move issue', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
