import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  parentId: text('parent_id').references((): ReturnType<typeof text> => issues.id, {
    onDelete: 'cascade',
  }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('backlog'),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const issueSessions = sqliteTable(
  'issue_sessions',
  {
    issueId: text('issue_id')
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull(),
    linkType: text('link_type'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.issueId, table.sessionId] })]
);

export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
});

export const issueLabels = sqliteTable(
  'issue_labels',
  {
    issueId: text('issue_id')
      .notNull()
      .references(() => issues.id, { onDelete: 'cascade' }),
    labelId: text('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.issueId, table.labelId] })]
);

export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filters: text('filters').notNull(),
  columnConfig: text('column_config').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;

export type IssueSession = typeof issueSessions.$inferSelect;
export type NewIssueSession = typeof issueSessions.$inferInsert;

export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;

export type IssueLabel = typeof issueLabels.$inferSelect;
export type NewIssueLabel = typeof issueLabels.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;
