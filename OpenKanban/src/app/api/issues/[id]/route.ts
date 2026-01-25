/**
 * Issue Detail API Routes - Get, Update, Delete
 * @see specs/03-api-contracts.md:L28-30
 *
 * GET    /api/issues/[id] - Get single issue by ID
 * PATCH  /api/issues/[id] - Update an existing issue
 * DELETE /api/issues/[id] - Delete an issue (cascades to children)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { IssueService } from '@/services/issue-service';
import { UpdateIssueSchema } from '@/contract/pm/schemas';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/issues/[id]
 * Get a single issue by ID with its relations.
 * @see specs/03-api-contracts.md:L28
 *
 * Response: { success: true, data: IssueWithRelations }
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
    const service = new IssueService(repo);

    const issue = service.getIssueWithRelations(id);
    if (!issue) {
      return NextResponse.json(
        {
          success: false,
          error: { message: `Issue with id "${id}" not found`, code: 'NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    logger.error('GET /api/issues/[id] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to get issue', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/issues/[id]
 * Update an existing issue.
 * @see specs/03-api-contracts.md:L29
 *
 * Request body: UpdateIssueInput (partial)
 * Response: { success: true, data: Issue }
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

    const result = UpdateIssueSchema.safeParse(body);
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

    const updatedIssue = service.updateIssue(id, result.data);

    return NextResponse.json({
      success: true,
      data: updatedIssue,
    });
  } catch (error) {
    logger.error('PATCH /api/issues/[id] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to update issue', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/issues/[id]
 * Delete an issue by ID.
 * Cascades to children and session links via foreign key constraints.
 * @see specs/03-api-contracts.md:L30
 *
 * Response: { success: true, data: { id: string } }
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

    service.deleteIssue(id);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    logger.error('DELETE /api/issues/[id] failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to delete issue', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
