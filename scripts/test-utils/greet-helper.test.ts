import { describe, expect, it } from 'vitest';
import { greet } from './greet-helper';

describe('greet helper', () => {
  it('should return greeting message', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  it('should handle different names', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
    expect(greet('Bob')).toBe('Hello, Bob!');
  });
});
