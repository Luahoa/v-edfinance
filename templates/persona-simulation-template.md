# EdTech AI Persona Simulation Template

Template for simulating high-scale user behaviors for stress testing and AI training.

## Features
- **Persona Modeling**: Simulates different user types (HUNTER, SAVER, STUDENT, etc.).
- **High Concurrency**: Verified for 500+ WS connections and 150+ EPS.
- **Multi-Market Support**: Simulates traffic across different locales (VI, EN, ZH).

## Simulation Logic
1. **Setup**: Create N users with specific metadata (locale, persona).
2. **Execution**: Parallel execution of `logEvent` with varying payloads.
3. **Verification**: Integrity checks on JSONB sharded content.

## Usage Example
Refer to `apps/api/test/multi-market-stress.e2e-spec.ts` for the full implementation pattern.
