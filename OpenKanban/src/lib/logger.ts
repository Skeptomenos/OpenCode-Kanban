/**
 * Structured logging utility for OpenKanban.
 *
 * Provides consistent log formatting with timestamps and context.
 * - debug: Development only (filtered in production)
 * - info: General operational messages
 * - warn: Recoverable issues
 * - error: Failures requiring attention
 *
 * @see Issue B.1 - Centralized date handling
 */

import { nowISO } from './date-utils';

type LogContext = Record<string, unknown>;

const formatMessage = (level: string, msg: string, ctx?: LogContext): string => {
  const timestamp = nowISO();
  const ctxStr = ctx ? ` ${JSON.stringify(ctx)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${msg}${ctxStr}`;
};

/* eslint-disable no-console */
export const logger = {
  debug: (msg: string, ctx?: LogContext): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', msg, ctx));
    }
  },
  info: (msg: string, ctx?: LogContext): void => {
    console.info(formatMessage('info', msg, ctx));
  },
  warn: (msg: string, ctx?: LogContext): void => {
    console.warn(formatMessage('warn', msg, ctx));
  },
  error: (msg: string, ctx?: LogContext): void => {
    console.error(formatMessage('error', msg, ctx));
  },
};
/* eslint-enable no-console */
