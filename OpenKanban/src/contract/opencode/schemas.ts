import { z } from 'zod';

// --- Primitives ---

export const TimestampSchema = z.object({
  created: z.number(),
  updated: z.number(),
  initialized: z.number().optional()
}).strict();

// --- Project ---

export const ProjectSchema = z.object({
  id: z.string(),
  worktree: z.string(),
  vcs: z.string().optional(),
  icon: z.object({
    color: z.string(),
    url: z.string().optional()
  }).strict().optional(),
  time: TimestampSchema.optional()
}).strict();

// --- Session ---

export const SessionSummarySchema = z.object({
  additions: z.number().optional(),
  deletions: z.number().optional(),
  files: z.number().optional()
}).strict();

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  projectID: z.string(),
  directory: z.string(),
  parentID: z.string().optional().nullable(),
  time: TimestampSchema,
  summary: SessionSummarySchema.optional()
}).strict();

// --- Message Part ---

/**
 * A message part represents a single piece of content within a message.
 * Parts are stored in the `part/{messageId}/` directory.
 * @see ralph-wiggum/specs/5.5-deferred-features.md:L7-13
 */
export const MessagePartSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'tool_call', 'tool_result']),
  text: z.string().optional(),
  synthetic: z.boolean().optional(),
  time: z.object({
    start: z.number(),
    end: z.number()
  }).strict(),
  messageID: z.string(),
  sessionID: z.string()
}).passthrough(); // Allow additional fields we don't use

// --- Message ---

export const MessageSchema = z.object({
  id: z.string(),
  sessionID: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  time: z.object({
    created: z.number(),
    completed: z.number().optional()
  }).strict()
}).passthrough(); // Allow additional fields like summary, agent, model, tools
