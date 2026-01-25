import { z } from 'zod';
import {
  CreateIssueSchema,
  UpdateIssueSchema,
  IssueFilterSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
  BoardFiltersSchema,
  ColumnConfigSchema,
  LinkSessionSchema,
  SetConfigSchema,
  MetadataSchema,
} from './schemas';

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
export type IssueFilter = z.infer<typeof IssueFilterSchema>;

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type BoardFilters = z.infer<typeof BoardFiltersSchema>;
export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;

export type LinkSessionInput = z.infer<typeof LinkSessionSchema>;
export type SetConfigInput = z.infer<typeof SetConfigSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
