/**
 * Board Detail API Routes - Get, Update, Delete
 * @see specs/04-boards-integration.md:L27
 * @see specs/SCHEMA.md:L304-312
 *
 * GET    /api/boards/[id] - Get single board by ID with filtered issues
 * PATCH  /api/boards/[id] - Update an existing board
 * DELETE /api/boards/[id] - Delete a board
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { UpdateBoardSchema } from '@/contract/pm/schemas';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/boards/[id]
 * Get a single board by ID with its filtered issues.
 * @see specs/SCHEMA.md:L309
 *
 * Response: { success: true, data: Board & { issues: IssueWithRelations[] } }
 * Errors: 404 if not found, 500 for internal errors
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const db = getDb();
    const repo = new SqlitePMRepository(db);

    const board = repo.getBoard(id);
    if (!board) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Board with id "${id}" not found`, code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    const issues = repo.listIssues(board.filters);
    const issueIds = issues.map((issue) => issue.id);
    const issuesWithRelations = repo.getIssuesWithRelations(issueIds);

    return NextResponse.json({
      success: true,
      data: {
        ...board,
        issues: issuesWithRelations,
      },
    });
  } catch (error) {
    logger.error('GET /api/boards/[id] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to get board', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/boards/[id]
 * Update an existing board.
 * @see specs/SCHEMA.md:L311
 *
 * Request body: UpdateBoardInput (partial)
 * Response: { success: true, data: Board }
 * Errors: 400 for validation, 404 if not found, 500 for internal errors
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const db = getDb();
    const repo = new SqlitePMRepository(db);

    const existing = repo.getBoard(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Board with id "${id}" not found`, code: 'NOT_FOUND' },
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

    const result = UpdateBoardSchema.safeParse(body);
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

    const updatedBoard = repo.updateBoard(id, result.data);

    return NextResponse.json({
      success: true,
      data: updatedBoard,
    });
  } catch (error) {
    logger.error('PATCH /api/boards/[id] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to update board', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/boards/[id]
 * Delete a board by ID.
 * @see specs/SCHEMA.md:L312
 *
 * Response: { success: true, data: { deleted: true } }
 * Errors: 404 if not found, 500 for internal errors
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const db = getDb();
    const repo = new SqlitePMRepository(db);

    const existing = repo.getBoard(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Board with id "${id}" not found`, code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    repo.deleteBoard(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    logger.error('DELETE /api/boards/[id] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to delete board', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
