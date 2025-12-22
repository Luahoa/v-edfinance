import { describe, expect, it } from 'vitest';
import { validateEmail } from './validator';

describe('validateEmail', () => {
  it('should validate correct email', () => {
    const result = validateEmail('test@example.com');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = validateEmail('invalid-email');
    expect(result.valid).toBe(false);
  });

  it('should handle empty input', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.message).toBe('Email required');
  });
});
