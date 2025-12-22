/**
 * Complex validator - for testing max iterations scenario
 * Intentionally has multiple code smell issues
 */

export function validateEmail(email: any): any {
  // Multiple issues to simulate complex review cycles
  const result = { valid: false, message: '' };

  if (!email) {
    result.message = 'Email required';
    return result;
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (regex.test(email)) {
    result.valid = true;
    result.message = 'Valid email';
  } else {
    result.message = 'Invalid email format';
  }

  return result;
}
