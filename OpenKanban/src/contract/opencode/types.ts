import { z } from 'zod';
import { ProjectSchema, SessionSchema, MessageSchema, MessagePartSchema } from './schemas';

export type OpenCodeProject = z.infer<typeof ProjectSchema>;
export type OpenCodeSession = z.infer<typeof SessionSchema>;
export type OpenCodeMessage = z.infer<typeof MessageSchema>;
export type OpenCodeMessagePart = z.infer<typeof MessagePartSchema>;

export interface OpenCodeMessageWithParts extends OpenCodeMessage {
  parts: OpenCodeMessagePart[];
}
