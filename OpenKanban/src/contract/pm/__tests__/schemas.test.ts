/**
 * PM Schemas Tests
 * @see specs/351-backend-arch.md:L45-55
 *
 * Tests for strict schema validation - verifies unknown fields are rejected.
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  CreateIssueSchema,
  UpdateIssueSchema,
  CreateBoardSchema,
  UpdateBoardSchema,
} from '../schemas';

describe('PM Schemas - Strict Mode', () => {
  describe('CreateIssueSchema', () => {
    it('accepts valid input', () => {
      const input = {
        type: 'task',
        title: 'Test Task',
        description: 'A test description',
        status: 'backlog',
      };

      const result = CreateIssueSchema.parse(input);
      expect(result.type).toBe('task');
      expect(result.title).toBe('Test Task');
    });

    it('rejects unknown fields', () => {
      const input = {
        type: 'task',
        title: 'Test Task',
        unknownField: 'should fail',
      };

      expect(() => CreateIssueSchema.parse(input)).toThrow(ZodError);

      try {
        CreateIssueSchema.parse(input);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
        const zodError = e as ZodError;
        expect(zodError.issues[0].code).toBe('unrecognized_keys');
        expect(zodError.issues[0].message).toContain('unknownField');
      }
    });
  });

  describe('UpdateIssueSchema', () => {
    it('accepts valid input', () => {
      const input = {
        title: 'Updated Title',
        status: 'in-progress',
      };

      const result = UpdateIssueSchema.parse(input);
      expect(result.title).toBe('Updated Title');
      expect(result.status).toBe('in-progress');
    });

    it('rejects unknown fields', () => {
      const input = {
        title: 'Updated Title',
        extraField: 'should fail',
      };

      expect(() => UpdateIssueSchema.parse(input)).toThrow(ZodError);

      try {
        UpdateIssueSchema.parse(input);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
        const zodError = e as ZodError;
        expect(zodError.issues[0].code).toBe('unrecognized_keys');
        expect(zodError.issues[0].message).toContain('extraField');
      }
    });
  });

  describe('CreateBoardSchema', () => {
    it('accepts valid input', () => {
      const input = {
        name: 'My Board',
        filters: { types: ['task'] },
        columnConfig: [
          { id: 'col1', title: 'Backlog', statusMappings: ['backlog'] },
        ],
      };

      const result = CreateBoardSchema.parse(input);
      expect(result.name).toBe('My Board');
    });

    it('rejects unknown fields', () => {
      const input = {
        name: 'My Board',
        invalidProp: 'should fail',
      };

      expect(() => CreateBoardSchema.parse(input)).toThrow(ZodError);

      try {
        CreateBoardSchema.parse(input);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
        const zodError = e as ZodError;
        expect(zodError.issues[0].code).toBe('unrecognized_keys');
        expect(zodError.issues[0].message).toContain('invalidProp');
      }
    });
  });

  describe('UpdateBoardSchema', () => {
    it('accepts valid input', () => {
      const input = {
        name: 'Updated Board Name',
      };

      const result = UpdateBoardSchema.parse(input);
      expect(result.name).toBe('Updated Board Name');
    });

    it('rejects unknown fields', () => {
      const input = {
        name: 'Updated Board',
        randomField: 'should fail',
      };

      expect(() => UpdateBoardSchema.parse(input)).toThrow(ZodError);

      try {
        UpdateBoardSchema.parse(input);
      } catch (e) {
        expect(e).toBeInstanceOf(ZodError);
        const zodError = e as ZodError;
        expect(zodError.issues[0].code).toBe('unrecognized_keys');
        expect(zodError.issues[0].message).toContain('randomField');
      }
    });
  });
});
