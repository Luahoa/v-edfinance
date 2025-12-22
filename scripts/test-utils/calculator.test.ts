import { describe, expect, it } from 'vitest';
import { add, multiply } from './calculator';

describe('calculator', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(10, 20)).toBe(30);
  });

  it('should multiply two numbers', () => {
    expect(multiply(3, 4)).toBe(12);
    expect(multiply(5, 6)).toBe(30);
  });
});
