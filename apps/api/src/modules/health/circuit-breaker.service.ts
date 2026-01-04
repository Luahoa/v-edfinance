import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreaker>();

  private readonly failureThreshold = 5;
  private readonly resetTimeout = 30000; // 30 seconds
  private readonly halfOpenSuccessThreshold = 3;

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const circuit = this.getOrCreateCircuit(key);

    if (circuit.state === CircuitState.OPEN) {
      if (Date.now() - circuit.lastFailureTime >= this.resetTimeout) {
        this.transitionTo(key, CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker '${key}' is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess(key);
      return result;
    } catch (error) {
      this.onFailure(key);
      throw error;
    }
  }

  getState(key: string): CircuitState {
    return this.circuits.get(key)?.state ?? CircuitState.CLOSED;
  }

  getStats(key: string): CircuitBreaker | undefined {
    return this.circuits.get(key);
  }

  reset(key: string): void {
    this.circuits.delete(key);
    this.logger.log(`Circuit '${key}' reset`);
  }

  private getOrCreateCircuit(key: string): CircuitBreaker {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
        successCount: 0,
      });
    }
    return this.circuits.get(key)!;
  }

  private onSuccess(key: string): void {
    const circuit = this.circuits.get(key);
    if (!circuit) return;

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successCount++;
      if (circuit.successCount >= this.halfOpenSuccessThreshold) {
        this.transitionTo(key, CircuitState.CLOSED);
      }
    } else {
      circuit.failures = 0;
    }
  }

  private onFailure(key: string): void {
    const circuit = this.circuits.get(key);
    if (!circuit) return;

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      this.transitionTo(key, CircuitState.OPEN);
    } else if (circuit.failures >= this.failureThreshold) {
      this.transitionTo(key, CircuitState.OPEN);
    }
  }

  private transitionTo(key: string, state: CircuitState): void {
    const circuit = this.circuits.get(key);
    if (!circuit) return;

    this.logger.warn(
      `Circuit '${key}' transitioning from ${circuit.state} to ${state}`,
    );
    circuit.state = state;

    if (state === CircuitState.CLOSED) {
      circuit.failures = 0;
      circuit.successCount = 0;
    } else if (state === CircuitState.HALF_OPEN) {
      circuit.successCount = 0;
    }
  }
}
