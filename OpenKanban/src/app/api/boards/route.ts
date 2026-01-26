/**
 * Boards API Routes - List and Create
 * @see specs/04-boards-integration.md:L27
 * @see specs/SCHEMA.md:L304-312
 *
 * GET  /api/boards - List all boards
 * POST /api/boards - Create a new board
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/connection';
import { SqlitePMRepository } from '@/lib/db/repository';
import { BoardService } from '@/services/board-service';
import { CreateBoardSchema } from '@/contract/pm/schemas';
import { logger } from '@/lib/logger';

/**
 * GET /api/boards
 * List all boards.
 * @see specs/SCHEMA.md:L308
 *
 * Response: { success: true, data: Board[] }
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const repo = new SqlitePMRepository(db);
    const service = new BoardService(repo);

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId') ?? undefined;

    const boards = service.listBoards(parentId ? { parentId } : undefined);

    return NextResponse.json({
      success: true,
      data: boards,
    });
  } catch (error) {
    logger.error('GET /api/boards failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to list boards', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/boards
 * Create a new board.
 * @see specs/SCHEMA.md:L310
 *
 * Request body: CreateBoardInput
 * Response: { success: true, data: Board }
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const repo = new SqlitePMRepository(db);
    const service = new BoardService(repo);

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

    const result = CreateBoardSchema.safeParse(body);
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

    const board = service.createBoard(result.data);

    return NextResponse.json({
      success: true,
      data: board,
    });
  } catch (error) {
    logger.error('POST /api/boards failed', { error: String(error) });
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Failed to create board', code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
