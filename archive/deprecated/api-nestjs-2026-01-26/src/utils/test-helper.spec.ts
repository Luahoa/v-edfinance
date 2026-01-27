import { describe, it, expect } from 'vitest';
import { greet } from './test-helper';

describe('greet', () => {
  it('should return greeting', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
});
