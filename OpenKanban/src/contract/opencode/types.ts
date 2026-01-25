import { z } from 'zod';
import { ProjectSchema, SessionSchema, MessageSchema } from './schemas';

export type OpenCodeProject = z.infer<typeof ProjectSchema>;
export type OpenCodeSession = z.infer<typeof SessionSchema>;
export type OpenCodeMessage = z.infer<typeof MessageSchema>;
