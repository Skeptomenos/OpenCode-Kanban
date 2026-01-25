/**
 * Issues API Routes - List and Create
 * @see specs/03-api-contracts.md:L25-27
 * @see specs/SCHEMA.md:L296-302
 *
 * GET  /api/issues - List issues with optional filters
 * POST /api/issues - Create a new issue
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { CreateIssueSchema, IssueFilterSchema } from '@/contract/pm/schemas';
import type { IssueFilter } from '@/lib/db/repository';

/**
 * GET /api/issues
 * List issues with optional query param filters.
 * @see specs/SCHEMA.md:L297-298
 *
 * Query params:
 * - type: Filter by type(s), comma-separated
 * - status: Filter by status(es), comma-separated
 * - parentId: Filter by parent ID (use 'null' for root issues)
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const repo = new SqlitePMRepository(db);

    const searchParams = request.nextUrl.searchParams;
    const filter: IssueFilter = {};

    const typeParam = searchParams.get('type');
    if (typeParam) {
      filter.types = typeParam.split(',').map((t) => t.trim());
    }

    const statusParam = searchParams.get('status');
    if (statusParam) {
      filter.statuses = statusParam.split(',').map((s) => s.trim());
    }

    const parentIdParam = searchParams.get('parentId');
    if (parentIdParam !== null) {
      filter.parentId = parentIdParam === 'null' ? null : parentIdParam;
    }

    const filterResult = IssueFilterSchema.safeParse(filter);
    if (!filterResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Invalid filter parameters', code: 'VALIDATION_ERROR' },
        },
        { status: 400 }
      );
    }

    const issues = repo.listIssues(
      Object.keys(filter).length > 0 ? filter : undefined
    );

    return NextResponse.json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('GET /api/issues error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to list issues', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/issues
 * Create a new issue.
 * @see specs/SCHEMA.md:L300
 *
 * Request body: CreateIssueInput
 * Response: { success: true, data: Issue }
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const repo = new SqlitePMRepository(db);

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

    const result = CreateIssueSchema.safeParse(body);
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

    const issue = repo.createIssue(result.data);

    return NextResponse.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to create issue', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
